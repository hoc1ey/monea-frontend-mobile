import { useQueries } from '@tanstack/react-query';
import { differenceInCalendarDays, endOfWeek, startOfDay, startOfWeek } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

import { getAccounts, type Account } from '@/api/accounts';
import {
  getCreditCardDebt,
  getCreditCardReport,
  getCreditCards,
  type CreditCard,
} from '@/api/creditCards';
import { getExpenses, getPendingExpenses, type Expense } from '@/api/expenses';
import { getIncomes, type Income } from '@/api/incomes';
import { getReminders, type Reminder } from '@/api/notifications';
import { getCollections } from '@/api/obligations';
import { getMe, type UserProfile } from '@/api/users';
import {
  expenseToMovement,
  incomeToMovement,
  sortMovements,
  type Movement,
} from '@/features/movements/movements';
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

interface WeekBounds {
  /** Monday 00:00 of the current week in the user timezone. */
  start: Date;
  /** Sunday 23:59:59.999 of the current week in the user timezone. */
  end: Date;
  from: string;
  to: string;
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
  /** Incomes and expenses made this week (Monday–Sunday, all accounts). */
  week: Movement[];
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

/** Monday–Sunday bounds of the current week (user timezone) as UTC ISO strings. */
function weekBounds(now: Date, timezone: string): WeekBounds {
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });

  return {
    start,
    end,
    from: fromZonedTime(start, timezone).toISOString(),
    to: fromZonedTime(end, timezone).toISOString(),
  };
}

/** Incomes and expenses made this week (all accounts), newest first. */
function collectWeekMovements(
  incomes: Income[],
  expenses: Expense[],
  bounds: WeekBounds,
  timezone: string,
): Movement[] {
  const inWeek = (date: string) => {
    const zoned = toZonedTime(date, timezone);
    return zoned >= bounds.start && zoned <= bounds.end;
  };

  return sortMovements([
    ...incomes.filter((income) => inWeek(income.date)).map(incomeToMovement),
    ...expenses.filter((expense) => inWeek(expense.date)).map(expenseToMovement),
  ]);
}

/**
 * Aggregates the F05 dashboard with `useQueries`: profile, accounts, cards
 * (debt + current statement), obligations, pending expense amounts, upcoming
 * reminders and this week's movements (incomes/expenses). Every query shares
 * a 60 s `staleTime`.
 */
export function useHomeDashboard(): HomeDashboard {
  const authUser = useAuthStore((state) => state.user);
  const timezone = authUser?.timezone ?? detectTimezone();
  const now = toZonedTime(new Date(), timezone);
  const period = currentPeriod(now);
  const week = weekBounds(now, timezone);

  const [
    meQuery,
    accountsQuery,
    cardsQuery,
    collectionsQuery,
    pendingExpensesQuery,
    remindersQuery,
    weekIncomesQuery,
    weekExpensesQuery,
  ] = useQueries({
    queries: [
      { queryKey: ['users', 'me'], queryFn: getMe, staleTime: STALE_TIME },
      { queryKey: ['accounts'], queryFn: getAccounts, staleTime: STALE_TIME },
      { queryKey: ['credit-cards'], queryFn: getCreditCards, staleTime: STALE_TIME },
      { queryKey: ['collections'], queryFn: () => getCollections(), staleTime: STALE_TIME },
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
      {
        queryKey: ['incomes', { from: week.from, to: week.to }],
        queryFn: () => getIncomes({ from: week.from, to: week.to, limit: 100 }),
        staleTime: STALE_TIME,
      },
      {
        queryKey: ['expenses', { from: week.from, to: week.to }],
        queryFn: () => getExpenses({ from: week.from, to: week.to, limit: 100 }),
        staleTime: STALE_TIME,
      },
    ],
  });

  const cards: CreditCard[] = cardsQuery.data ?? [];

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
  const pendingExpenses = pendingExpensesQuery.data ?? [];
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

  const weekMovements = collectWeekMovements(
    weekIncomesQuery.data?.items ?? [],
    weekExpensesQuery.data?.items ?? [],
    week,
    timezone,
  );

  const allQueries = [
    meQuery,
    accountsQuery,
    cardsQuery,
    collectionsQuery,
    pendingExpensesQuery,
    remindersQuery,
    weekIncomesQuery,
    weekExpensesQuery,
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
    week: weekMovements,
    totals: {
      balance: sumMoney(accounts.map((account) => account.currentBalance)),
      cardDebt: sumMoney(cardDeptTotals),
      toCollect: sumMoney(collections.map((collection) => collection.pendingAmount ?? 0)),
    },
    refetch: () => Promise.all(allQueries.map((query) => query.refetch())),
  };
}
