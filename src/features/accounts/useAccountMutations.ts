import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';

import {
  createAccount,
  deleteAccount,
  updateAccount,
  type AccountInput,
  type AccountUpdateInput,
} from '@/api/accounts';

import { ACCOUNTS_QUERY_KEY } from './useAccounts';

/**
 * F16 invalidation table: an account change affects the list, the home
 * dashboard (same `accounts` key) and the movement rows, which display the
 * account name.
 */
function invalidateAccounts(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: ['incomes'] }),
    queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  ]);
}

/** POST /accounts — invalidates the list (and every derived account query). */
export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AccountInput) => createAccount(input),
    onSuccess: () => invalidateAccounts(queryClient),
  });
}

/** PATCH /accounts/:id — invalidates the list and the edited account. */
export function useUpdateAccount(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AccountUpdateInput) => updateAccount(id, input),
    onSuccess: () => invalidateAccounts(queryClient),
  });
}

/** DELETE /accounts/:id — invalidates the list after removing the account. */
export function useDeleteAccount(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteAccount(id),
    onSuccess: () => invalidateAccounts(queryClient),
  });
}
