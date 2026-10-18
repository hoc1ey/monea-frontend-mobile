import type { QueryClient } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { PayInstallmentInput } from '@/api/obligations';

import {
  createObligation,
  deleteObligation,
  OBLIGATION_QUERY_KEYS,
  payObligationInstallment,
  updateObligation,
  type ObligationFormPayload,
  type ObligationKind,
  type ObligationUpdatePayload,
} from './obligations';

/**
 * A collection/loan/debt mutation touches accounts, movements and the home
 * dashboard (F16 invalidation table): the list, accounts, incomes and expenses.
 */
function invalidateObligations(
  queryClient: QueryClient,
  kind: ObligationKind,
): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: OBLIGATION_QUERY_KEYS[kind] }),
    queryClient.invalidateQueries({ queryKey: ['accounts'] }),
    queryClient.invalidateQueries({ queryKey: ['incomes'] }),
    queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  ]);
}

/** POST /collections | /loans | /debts — registers an obligation. */
export function useCreateObligation(kind: ObligationKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ObligationFormPayload) => createObligation(kind, payload),
    onSuccess: () => invalidateObligations(queryClient, kind),
  });
}

/** PATCH /collections | /loans | /debts/:id — updates the editable subset. */
export function useUpdateObligation(kind: ObligationKind, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ObligationUpdatePayload) => updateObligation(kind, id, payload),
    onSuccess: () => invalidateObligations(queryClient, kind),
  });
}

/** DELETE /collections | /loans | /debts/:id — conserves the generated movements. */
export function useDeleteObligation(kind: ObligationKind, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteObligation(kind, id),
    onSuccess: () => invalidateObligations(queryClient, kind),
  });
}

interface PayInstallmentVariables {
  installmentId: string;
  input: PayInstallmentInput;
}

/** POST .../installments/:installmentId/pay — creates the income/expense. */
export function usePayInstallment(kind: ObligationKind, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ installmentId, input }: PayInstallmentVariables) =>
      payObligationInstallment(kind, id, installmentId, input),
    onSuccess: () => invalidateObligations(queryClient, kind),
  });
}
