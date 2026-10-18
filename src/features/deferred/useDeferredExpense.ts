import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createExpense, type Expense, type ExpenseInput } from '@/api/expenses';
import { CREDIT_CARDS_QUERY_KEY } from '@/features/cards/keys';

/**
 * `POST /expenses` for a deferred purchase. It does not change the account
 * balance; it only adds installments to the card, so the expenses list and the
 * card queries are invalidated (the accounts stay untouched).
 */
export function useCreateDeferredExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ExpenseInput): Promise<Expense> => createExpense(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
      void queryClient.invalidateQueries({ queryKey: CREDIT_CARDS_QUERY_KEY });
    },
  });
}
