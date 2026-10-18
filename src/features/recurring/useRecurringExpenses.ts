import { useQuery } from '@tanstack/react-query';

import { getExpenses } from '@/api/expenses';
import { getRecurringExpense, getRecurringExpenses } from '@/api/recurringExpenses';

import { RECURRING_QUERY_KEY } from './keys';
import { retryRecurring } from './retry';

/** `GET /recurring-expenses` — configurations ordered by `createdAt` DESC. */
export function useRecurringExpenses() {
  return useQuery({ queryKey: RECURRING_QUERY_KEY, queryFn: getRecurringExpenses });
}

/** `GET /recurring-expenses/:id` — single configuration (detail / edit form). */
export function useRecurringExpense(id: string) {
  return useQuery({
    queryKey: ['recurring-expenses', id],
    queryFn: () => getRecurringExpense(id),
    enabled: Boolean(id),
    retry: retryRecurring,
  });
}

/**
 * Expenses generated from one configuration. `/expenses` has no
 * `recurringConfigId` query, so the filter is applied on the client.
 */
export function useRecurringGeneratedExpenses(configId: string) {
  return useQuery({
    queryKey: ['expenses', 'recurring', configId],
    queryFn: async () => {
      const page = await getExpenses({ limit: 100 });
      return page.items.filter((expense) => expense.recurringConfigId === configId);
    },
    enabled: Boolean(configId),
  });
}
