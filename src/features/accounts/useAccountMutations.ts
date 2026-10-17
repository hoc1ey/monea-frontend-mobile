import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createAccount,
  deleteAccount,
  updateAccount,
  type AccountInput,
  type AccountUpdateInput,
} from '@/api/accounts';

import { ACCOUNTS_QUERY_KEY } from './useAccounts';

/** POST /accounts — invalidates the list (and every derived account query). */
export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AccountInput) => createAccount(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY }),
  });
}

/** PATCH /accounts/:id — invalidates the list and the edited account. */
export function useUpdateAccount(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AccountUpdateInput) => updateAccount(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY }),
  });
}

/** DELETE /accounts/:id — invalidates the list after removing the account. */
export function useDeleteAccount(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteAccount(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY }),
  });
}
