import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createCreditCard,
  deleteCreditCard,
  payCreditCardPeriod,
  updateCreditCard,
  type CreditCardInput,
  type CreditCardPayInput,
  type CreditCardUpdateInput,
} from '@/api/creditCards';

import { CREDIT_CARDS_QUERY_KEY } from './keys';

/** POST /credit-cards — invalidates the list (and every derived card query). */
export function useCreateCreditCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreditCardInput) => createCreditCard(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CREDIT_CARDS_QUERY_KEY }),
  });
}

/** PATCH /credit-cards/:id — invalidates the list and the edited card. */
export function useUpdateCreditCard(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreditCardUpdateInput) => updateCreditCard(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CREDIT_CARDS_QUERY_KEY }),
  });
}

/** DELETE /credit-cards/:id — invalidates the list after removing the card. */
export function useDeleteCreditCard(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteCreditCard(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CREDIT_CARDS_QUERY_KEY }),
  });
}

/**
 * POST /credit-cards/:id/pay — the payment creates a CORRIENTE expense, so the
 * card (list, debt and report), the accounts and the movements are refreshed.
 */
export function usePayCreditCard(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreditCardPayInput) => payCreditCardPeriod(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CREDIT_CARDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
