import type { QueryClient } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createExpense,
  deleteExpense,
  setExpenseAmount,
  updateExpense,
  type ExpenseInput,
  type ExpenseUpdateInput,
} from '@/api/expenses';
import {
  createIncome,
  deleteIncome,
  updateIncome,
  type IncomeInput,
  type IncomeUpdateInput,
} from '@/api/incomes';
import { ACCOUNTS_QUERY_KEY } from '@/features/accounts/useAccounts';

/** Invalidates the queries affected by creating/editing/deleting a movement. */
function invalidateMovements(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['incomes'] }),
    queryClient.invalidateQueries({ queryKey: ['expenses'] }),
    queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY }),
  ]);
}

/** POST /incomes — invalidates incomes, expenses and accounts. */
export function useCreateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: IncomeInput) => createIncome(input),
    onSuccess: () => invalidateMovements(queryClient),
  });
}

/** PATCH /incomes/:id. */
export function useUpdateIncome(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: IncomeUpdateInput) => updateIncome(id, input),
    onSuccess: () => invalidateMovements(queryClient),
  });
}

/** DELETE /incomes/:id — only manual incomes. */
export function useDeleteIncome(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteIncome(id),
    onSuccess: () => invalidateMovements(queryClient),
  });
}

/** POST /expenses — invalidates incomes, expenses and accounts. */
export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ExpenseInput) => createExpense(input),
    onSuccess: () => invalidateMovements(queryClient),
  });
}

/** PATCH /expenses/:id. */
export function useUpdateExpense(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ExpenseUpdateInput) => updateExpense(id, input),
    onSuccess: () => invalidateMovements(queryClient),
  });
}

/** PATCH /expenses/:id/amount — fixes a variable recurring expense amount (F10). */
export function useSetExpenseAmount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => setExpenseAmount(id, amount),
    onSuccess: () => invalidateMovements(queryClient),
  });
}

/** DELETE /expenses/:id — automatic sources (except recurring) return 400. */
export function useDeleteExpense(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteExpense(id),
    onSuccess: () => invalidateMovements(queryClient),
  });
}
