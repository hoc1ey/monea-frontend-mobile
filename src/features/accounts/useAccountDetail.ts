import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { getAccount } from '@/api/accounts';
import { isApiError } from '@/api/client';
import { getExpenses, type ExpenseSourceType } from '@/api/expenses';
import { getIncomes, type IncomeSourceType } from '@/api/incomes';

const INCOME_ORIGIN: Record<IncomeSourceType, string> = {
  MANUAL: 'Manual',
  COLLECTION_INSTALLMENT: 'Cobro',
  LOAN_INSTALLMENT: 'Préstamo',
};

const EXPENSE_ORIGIN: Record<ExpenseSourceType, string> = {
  MANUAL: 'Manual',
  RECURRING: 'Recurrente',
  CARD_PAYMENT: 'Tarjeta',
  LOAN_CREATION: 'Préstamo',
  DEBT_PAYMENT: 'Deuda',
  SHOPPING_LIST: 'Lista',
};

export type AccountMovementKind = 'income' | 'expense';
export type AccountMovementSource = IncomeSourceType | ExpenseSourceType;

/** Unified income/expense row rendered in the account detail (F08 owns the full list). */
export interface AccountMovement {
  id: string;
  kind: AccountMovementKind;
  sourceType: AccountMovementSource;
  name: string;
  amount: number;
  date: string;
  /** Recurring expense whose amount still has to be set. */
  pending: boolean;
  /** Deferred expense charged to a credit card. */
  deferred: boolean;
  origin: string;
}

function buildMovements(
  incomes: Awaited<ReturnType<typeof getIncomes>>['items'],
  expenses: Awaited<ReturnType<typeof getExpenses>>['items'],
): AccountMovement[] {
  const movements: AccountMovement[] = [
    ...incomes.map((income) => ({
      id: income.id,
      kind: 'income' as const,
      sourceType: income.sourceType,
      name: income.name,
      amount: income.amount,
      date: income.date,
      pending: false,
      deferred: false,
      origin: INCOME_ORIGIN[income.sourceType],
    })),
    ...expenses.map((expense) => ({
      id: expense.id,
      kind: 'expense' as const,
      sourceType: expense.sourceType,
      name: expense.name,
      amount: expense.amount,
      date: expense.date,
      pending: expense.amountPending,
      deferred: expense.paymentMethod === 'DIFERIDO',
      origin: EXPENSE_ORIGIN[expense.sourceType],
    })),
  ];

  return movements.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** Account detail: the account plus its combined income/expense movements. */
export function useAccountDetail(id: string) {
  const accountQuery = useQuery({
    queryKey: ['accounts', id],
    queryFn: () => getAccount(id),
    enabled: Boolean(id),
  });

  const incomesQuery = useQuery({
    queryKey: ['incomes', { accountId: id }],
    queryFn: () => getIncomes({ accountId: id, limit: 100 }),
    enabled: Boolean(id),
  });

  const expensesQuery = useQuery({
    queryKey: ['expenses', { accountId: id }],
    queryFn: () => getExpenses({ accountId: id, limit: 100 }),
    enabled: Boolean(id),
  });

  const movements = useMemo(
    () => buildMovements(incomesQuery.data?.items ?? [], expensesQuery.data?.items ?? []),
    [incomesQuery.data, expensesQuery.data],
  );

  const queries = [accountQuery, incomesQuery, expensesQuery];

  return {
    account: accountQuery.data,
    movements,
    isLoading: queries.some((query) => query.isPending),
    isRefreshing: !accountQuery.isPending && queries.some((query) => query.isFetching),
    isError: queries.some((query) => query.isError),
    isNotFound: isApiError(accountQuery.error) && accountQuery.error.status === 404,
    refetch: () => Promise.all(queries.map((query) => query.refetch())),
  };
}
