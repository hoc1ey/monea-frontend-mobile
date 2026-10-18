import { useQueries } from '@tanstack/react-query';
import { differenceInCalendarDays, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

import { getAccounts, type Account } from '@/api/accounts';
import {
  getCreditCardDebt,
  getCreditCardReport,
  getCreditCards,
  type CreditCard,
} from '@/api/creditCards';
import { getPendingExpenses, type Expense } from '@/api/expenses';
import { getReminders, type Reminder } from '@/api/notifications';
import { getCollections, getDebts, getLoans } from '@/api/obligations';
import { getMe, type UserProfile } from '@/api/users';
import { formatDate, sumMoney } from '@/lib/format';
import { currentPeriod } from '@/lib/notifications';
import { detectTimezone } from '@/lib/timezone';
import { useAuthStore } from '@/stores/auth';

/** F05 asks for a 60 s window across every dashboard query. */
const STALE_TIME = 60_000;

export interface HomeCard {
  id: string;
  name: string;
  color: string;
  issuer: string;
  paymentDay: number | null;
  /** Statement total for the current period, falling back to `currentDebt`. */
  periodDebt: number;
}

export interface HomeAttentionCard {
  kind: 'card-payment';
  id: string;
  cardId: string;
  title: string;
  subtitle: string;
  days: number;
}

export interface HomeAttentionExpense {
  kind: 'pending-expense';
  id: string;
  name: string;
}

export type HomeAttention = HomeAttentionCard | HomeAttentionExpense;

export type ObligationKind = 'cobros' | 'prestamos' | 'deudas';

export interface HomeWeekInstallment {
  key: string;
  kind: ObligationKind;
  parentId: string;
  title: string;
  subtitle: string;
  amount: number;
  tone: 'positive' | 'negative';
}

export interface HomeDashboard {
  isLoading: boolean;
  isRefreshing: boolean;
  isError: boolean;
  /** Current period (`YYYY-MM`) in the user timezone, used for card statements. */
  period: string;
  firstName: string;
  accounts: Account[];
  cards: HomeCard[];
  attention: HomeAttention[];
  week: HomeWeekInstallment[];
  totals: {
    balance: number;
    cardDebt: number;
    toCollect: number;
  };
  refetch: () => Promise<unknown>;
}

function firstWord(name: string | undefined): string {
  if (!name) {
    return '';
  }
  const [word] = name.trim().split(/\s+/);
  return word ?? '';
}

function attentionFromReminders(
  reminders: Reminder[],
  now: Date,
  timezone: string,
  cardNames: Map<string, string>,
): HomeAttentionCard[] {
  return reminders
    .filter((reminder) => reminder.type === 'CREDIT_CARD_PAYMENT')
    .map((reminder) => {
      const scheduled = toZonedTime(reminder.scheduledAt, timezone);
      const days = differenceInCalendarDays(startOfDay(scheduled), startOfDay(now));
      return { reminder, scheduled, days };
    })
    .filter(({ days }) => days >= 0 && days <= 3)
    .map(({ reminder, scheduled, days }) => {
      const cardName = cardNames.get(reminder.sourceId);
      const title = cardName
        ? days === 0
          ? `Pago ${cardName} hoy`
          : `Pago ${cardName} en ${days} ${days === 1 ? 'día' : 'días'}`
        : reminder.title;

      return {
        kind: 'card-payment' as const,
        id: reminder.id,
        cardId: reminder.sourceId,
        title,
        subtitle: `Recordatorio · ${formatDate(scheduled, "d MMM HH:mm")}`,
        days,
      };
    });
}

function attentionFromExpenses(expenses: Expense[]): HomeAttentionExpense[] {
  return expenses.map((expense) => ({
    kind: 'pending-expense' as const,
    id: expense.id,
    name: expense.name,
  }));
}

const KIND_LABEL: Record<ObligationKind, string> = {
  cobros: 'Cobro',
  prestamos: 'Préstamo',
  deudas: 'Deuda',
};

interface ObligationSource {
  kind: ObligationKind;
  parentId: string;
  personName: string;
  installmentsCount: number;
  installments: { id: string; number: number; amount: number; dueDate: string; isPaid: boolean }[];
}

function collectWeekInstallments(
  sources: ObligationSource[],
  now: Date,
  timezone: string,
): HomeWeekInstallment[] {
  const items: { days: number; item: HomeWeekInstallment }[] = [];

  for (const source of sources) {
    for (const installment of source.installments) {
      if (installment.isPaid) {
        continue;
      }

      const due = toZonedTime(installment.dueDate, timezone);
      const days = differenceInCalendarDays(startOfDay(due), startOfDay(now));

      if (days < 0 || days > 7) {
        continue;
      }

      items.push({
        days,
        item: {
          key: `${source.parentId}:${installment.id}`,
          kind: source.kind,
          parentId: source.parentId,
          title: `${source.personName} · cuota ${installment.number} de ${source.installmentsCount}`,
          subtitle: `${KIND_LABEL[source.kind]} · vence ${formatDate(due, 'd MMM')}`,
          amount: installment.amount,
          tone: source.kind === 'cobros' ? 'positive' : 'negative',
        },
      });
    }
  }

  return items.sort((a, b) => a.days - b.days).map(({ item }) => item);
}

/**
 * Aggregates the F05 dashboard with `useQueries`: profile, accounts, cards
 * (debt + current statement), obligations, pending expense amounts and
 * upcoming reminders. Every query shares a 60 s `staleTime`.
 */
export function useHomeDashboard(): HomeDashboard {
  const authUser = useAuthStore((state) => state.user);
  const timezone = authUser?.timezone ?? detectTimezone();

  const [meQuery, accountsQuery, cardsQuery, collectionsQuery, loansQuery, debtsQuery, expensesQuery, remindersQuery] =
    useQueries({
      queries: [
        { queryKey: ['users', 'me'], queryFn: getMe, staleTime: STALE_TIME },
        { queryKey: ['accounts'], queryFn: getAccounts, staleTime: STALE_TIME },
        { queryKey: ['credit-cards'], queryFn: getCreditCards, staleTime: STALE_TIME },
        { queryKey: ['collections'], queryFn: () => getCollections(), staleTime: STALE_TIME },
        { queryKey: ['loans'], queryFn: () => getLoans(), staleTime: STALE_TIME },
        { queryKey: ['debts'], queryFn: () => getDebts(), staleTime: STALE_TIME },
        {
          queryKey: ['expenses', { amountPending: true }],
          queryFn: getPendingExpenses,
          staleTime: STALE_TIME,
        },
        {
          queryKey: ['notifications', 'reminders'],
          queryFn: getReminders,
          staleTime: STALE_TIME,
        },
      ],
    });

  const cards: CreditCard[] = cardsQuery.data ?? [];
  const now = toZonedTime(new Date(), timezone);
  const period = currentPeriod(now);

  const debtQueries = useQueries({
    queries: cards.map((card) => ({
      queryKey: ['credit-cards', card.id, 'debt'],
      queryFn: () => getCreditCardDebt(card.id),
      staleTime: STALE_TIME,
    })),
  });

  const reportQueries = useQueries({
    queries: cards.map((card) => ({
      queryKey: ['credit-cards', card.id, 'report', period],
      queryFn: () => getCreditCardReport(card.id, period),
      staleTime: STALE_TIME,
    })),
  });

  const accounts = accountsQuery.data ?? [];
  const collections = collectionsQuery.data ?? [];
  const loans = loansQuery.data ?? [];
  const debts = debtsQuery.data ?? [];
  const pendingExpenses = expensesQuery.data ?? [];
  const reminders = remindersQuery.data ?? [];

  const cardDeptTotals = cards.map((_, index) => debtQueries[index]?.data?.currentDebt ?? 0);

  const cardRows: HomeCard[] = cards.map((card, index) => ({
    id: card.id,
    name: card.name,
    color: card.color,
    issuer: card.issuer,
    paymentDay: card.paymentDay,
    periodDebt: reportQueries[index]?.data?.total ?? debtQueries[index]?.data?.currentDebt ?? 0,
  }));

  const weekSources: ObligationSource[] = [
    ...collections.map((collection) => ({
      kind: 'cobros' as const,
      parentId: collection.id,
      personName: collection.personName,
      installmentsCount: collection.installmentsCount,
      installments: collection.installments ?? [],
    })),
    ...loans.map((loan) => ({
      kind: 'prestamos' as const,
      parentId: loan.id,
      personName: loan.personName,
      installmentsCount: loan.installmentsCount,
      installments: loan.installments ?? [],
    })),
    ...debts.map((debt) => ({
      kind: 'deudas' as const,
      parentId: debt.id,
      personName: debt.personName,
      installmentsCount: debt.installmentsCount,
      installments: debt.installments ?? [],
    })),
  ];

  const allQueries = [
    meQuery,
    accountsQuery,
    cardsQuery,
    collectionsQuery,
    loansQuery,
    debtsQuery,
    expensesQuery,
    remindersQuery,
    ...debtQueries,
    ...reportQueries,
  ];

  const isLoading = allQueries.some((query) => query.isPending);
  const profile: UserProfile | undefined = meQuery.data;

  return {
    isLoading,
    isRefreshing: !isLoading && allQueries.some((query) => query.isFetching),
    isError: allQueries.some((query) => query.isError),
    period,
    firstName: firstWord(profile?.name ?? authUser?.name),
    accounts,
    cards: cardRows,
    attention: [
      ...attentionFromReminders(
        reminders,
        now,
        timezone,
        new Map(cards.map((card) => [card.id, card.name])),
      ),
      ...attentionFromExpenses(pendingExpenses),
    ],
    week: collectWeekInstallments(weekSources, now, timezone),
    totals: {
      balance: sumMoney(accounts.map((account) => account.currentBalance)),
      cardDebt: sumMoney(cardDeptTotals),
      toCollect: sumMoney(collections.map((collection) => collection.pendingAmount ?? 0)),
    },
    refetch: () => Promise.all(allQueries.map((query) => query.refetch())),
  };
}
