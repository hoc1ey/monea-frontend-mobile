import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createRecurringExpense,
  deleteRecurringExpense,
  setRecurringExpenseActive,
  updateRecurringExpense,
  type RecurringExpenseConfig,
  type RecurringExpenseInput,
  type RecurringExpenseUpdateInput,
} from '@/api/recurringExpenses';

import { RECURRING_QUERY_KEY } from './keys';

/** Invalidates the configurations and the movements they may have generated. */
function invalidateRecurring(queryClient: ReturnType<typeof useQueryClient>): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: RECURRING_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  ]);
}

/** POST /recurring-expenses — creates a configuration. */
export function useCreateRecurringExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecurringExpenseInput) => createRecurringExpense(input),
    onSuccess: () => invalidateRecurring(queryClient),
  });
}

/** PATCH /recurring-expenses/:id — updates the configuration. */
export function useUpdateRecurringExpense(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecurringExpenseUpdateInput) => updateRecurringExpense(id, input),
    onSuccess: () => invalidateRecurring(queryClient),
  });
}

interface ToggleVariables {
  id: string;
  isActive: boolean;
}

interface ToggleContext {
  previousList?: RecurringExpenseConfig[];
  previousDetail?: RecurringExpenseConfig;
}

/**
 * PATCH /recurring-expenses/:id/active — toggles the switch without deleting
 * expenses. The list and the detail cache are updated optimistically so the
 * switch reacts immediately; they roll back on error and refetch on settle.
 */
export function useSetRecurringActive() {
  const queryClient = useQueryClient();
  return useMutation<RecurringExpenseConfig, Error, ToggleVariables, ToggleContext>({
    mutationFn: ({ id, isActive }) => setRecurringExpenseActive(id, isActive),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: RECURRING_QUERY_KEY });
      await queryClient.cancelQueries({ queryKey: ['recurring-expenses', id] });

      const previousList = queryClient.getQueryData<RecurringExpenseConfig[]>(RECURRING_QUERY_KEY);
      const previousDetail = queryClient.getQueryData<RecurringExpenseConfig>([
        'recurring-expenses',
        id,
      ]);

      queryClient.setQueryData<RecurringExpenseConfig[]>(RECURRING_QUERY_KEY, (old) =>
        old?.map((config) => (config.id === id ? { ...config, isActive } : config)),
      );
      queryClient.setQueryData<RecurringExpenseConfig>(['recurring-expenses', id], (old) =>
        old ? { ...old, isActive } : old,
      );

      return { previousList, previousDetail };
    },
    onError: (_error, variables, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(RECURRING_QUERY_KEY, context.previousList);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(['recurring-expenses', variables.id], context.previousDetail);
      }
    },
    onSettled: () => invalidateRecurring(queryClient),
  });
}

/** DELETE /recurring-expenses/:id — keeps the expenses already generated. */
export function useDeleteRecurringExpense(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteRecurringExpense(id),
    onSuccess: () => invalidateRecurring(queryClient),
  });
}
