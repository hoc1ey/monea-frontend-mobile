import { useMemo } from 'react';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { toZonedTime } from 'date-fns-tz';

import { getExpenses, getPendingExpenses, type ExpensePaymentMethod } from '@/api/expenses';
import { getIncomes } from '@/api/incomes';
import { detectTimezone } from '@/lib/timezone';
import { useAuthStore } from '@/stores/auth';

import {
  expenseToMovement,
  groupMovements,
  incomeToMovement,
  sortMovements,
  type Movement,
  type MovementFilter,
  type MovementSection,
} from './movements';

export const MOVEMENTS_PAGE_SIZE = 20;

/** Query key prefix for the movements list; mutations invalidate it. */
export const MOVEMENTS_QUERY_KEY = ['movements'] as const;

interface SourceConfig {
  incomes: boolean;
  expenses: boolean;
  expensePaymentMethod?: ExpensePaymentMethod;
  /** The API cannot filter expenses by `sourceType`; recurrence is filtered client-side. */
  clientRecurringOnly: boolean;
}

const SOURCE_CONFIG: Record<MovementFilter, SourceConfig> = {
  all: { incomes: true, expenses: true, clientRecurringOnly: false },
  income: { incomes: true, expenses: false, clientRecurringOnly: false },
  expense: {
    incomes: false,
    expenses: true,
    expensePaymentMethod: 'CORRIENTE',
    clientRecurringOnly: false,
  },
  deferred: {
    incomes: false,
    expenses: true,
    expensePaymentMethod: 'DIFERIDO',
    clientRecurringOnly: false,
  },
  recurring: { incomes: false, expenses: true, clientRecurringOnly: true },
};

export interface MovementsResult {
  movements: Movement[];
  sections: MovementSection[];
  isLoading: boolean;
  isRefreshing: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => Promise<unknown>;
}

/**
 * Combined income/expense list. "Todos" merges both endpoints (ordered by
 * `date` DESC); the other chips hit a single endpoint, and "Recurrentes" is
 * filtered client-side because `/expenses` has no `sourceType` query.
 */
export function useMovements(filter: MovementFilter, search = ''): MovementsResult {
  const config = SOURCE_CONFIG[filter];
  const timezone = useAuthStore((state) => state.user?.timezone) ?? detectTimezone();

  const incomesQuery = useInfiniteQuery({
    queryKey: ['incomes', 'list'],
    enabled: config.incomes,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => getIncomes({ page: pageParam, limit: MOVEMENTS_PAGE_SIZE }),
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });

  const expensesQuery = useInfiniteQuery({
    queryKey: ['expenses', 'list', config.expensePaymentMethod ?? 'all'],
    enabled: config.expenses,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getExpenses({
        page: pageParam,
        limit: MOVEMENTS_PAGE_SIZE,
        paymentMethod: config.expensePaymentMethod,
      }),
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });

  const movements = useMemo(() => {
    const list: Movement[] = [];

    if (config.incomes) {
      for (const page of incomesQuery.data?.pages ?? []) {
        list.push(...page.items.map(incomeToMovement));
      }
    }
    if (config.expenses) {
      for (const page of expensesQuery.data?.pages ?? []) {
        list.push(...page.items.map(expenseToMovement));
      }
    }

    const filtered = config.clientRecurringOnly
      ? list.filter((movement) => movement.sourceType === 'RECURRING')
      : list;

    return sortMovements(filtered);
  }, [config, incomesQuery.data, expensesQuery.data]);

  const query = search.trim().toLowerCase();
  const visible = useMemo(
    () => (query ? movements.filter((movement) => movement.name.toLowerCase().includes(query)) : movements),
    [movements, query],
  );

  const sections = useMemo(
    () => groupMovements(visible, timezone, toZonedTime(new Date(), timezone)),
    [visible, timezone],
  );

  const activeQueries = [
    ...(config.incomes ? [incomesQuery] : []),
    ...(config.expenses ? [expensesQuery] : []),
  ];

  const isLoading = activeQueries.some((active) => active.isPending);

  const fetchNextPage = () => {
    if (config.incomes && incomesQuery.hasNextPage && !incomesQuery.isFetchingNextPage) {
      void incomesQuery.fetchNextPage();
    }
    if (config.expenses && expensesQuery.hasNextPage && !expensesQuery.isFetchingNextPage) {
      void expensesQuery.fetchNextPage();
    }
  };

  return {
    movements: visible,
    sections,
    isLoading,
    isRefreshing: !isLoading && activeQueries.some((active) => active.isFetching),
    isError: activeQueries.some((active) => active.isError),
    hasNextPage: activeQueries.some((active) => active.hasNextPage),
    isFetchingNextPage: activeQueries.some((active) => active.isFetchingNextPage),
    fetchNextPage,
    refetch: () => Promise.all(activeQueries.map((active) => active.refetch())),
  };
}

/** Recurring expenses awaiting an amount, used by the movements banner. */
export function usePendingExpenses() {
  return useQuery({
    queryKey: ['expenses', { amountPending: true }],
    queryFn: getPendingExpenses,
  });
}
