import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import {
  createTransfer,
  deleteTransfer,
  getTransfer,
  type TransferInput,
} from '@/api/transfers';
import { ACCOUNTS_QUERY_KEY } from '@/features/accounts/useAccounts';

/** Shared cache key prefix for transfers; mutations invalidate it. */
export const TRANSFERS_QUERY_KEY = ['transfers'] as const;

/** Invalidates the queries affected by creating/deleting a transfer. */
function invalidateTransfers(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: TRANSFERS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: ['incomes'] }),
    queryClient.invalidateQueries({ queryKey: ['expenses'] }),
    queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY }),
  ]);
}

/** `GET /transfers/:id` — single transfer (transfer detail screen). */
export function useTransferDetail(id: string) {
  return useQuery({
    queryKey: [...TRANSFERS_QUERY_KEY, id],
    queryFn: () => getTransfer(id),
    enabled: Boolean(id),
  });
}

/** `POST /transfers` — creates the transfer plus its linked expense/income. */
export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TransferInput) => createTransfer(input),
    onSuccess: () => invalidateTransfers(queryClient),
  });
}

/** `DELETE /transfers/:id` — restores both account balances. */
export function useDeleteTransfer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteTransfer(id),
    onSuccess: () => invalidateTransfers(queryClient),
  });
}
