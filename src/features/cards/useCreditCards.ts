import { useQuery } from '@tanstack/react-query';

import { getCreditCard, getCreditCards } from '@/api/creditCards';

import { CREDIT_CARDS_QUERY_KEY } from './keys';

/** `GET /credit-cards` — cards ordered by `createdAt` DESC. */
export function useCreditCards(enabled = true) {
  return useQuery({ queryKey: CREDIT_CARDS_QUERY_KEY, queryFn: getCreditCards, enabled });
}

/** `GET /credit-cards/:id` — single card (used to prefill the edit form). */
export function useCreditCard(id: string) {
  return useQuery({
    queryKey: ['credit-cards', id],
    queryFn: () => getCreditCard(id),
    enabled: Boolean(id),
  });
}
