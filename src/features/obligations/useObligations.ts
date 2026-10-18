import { useQuery } from '@tanstack/react-query';

import {
  fetchObligation,
  fetchObligations,
  OBLIGATION_QUERY_KEYS,
  type ObligationKind,
} from './obligations';

/** `GET /collections` | `/loans` | `/debts` — recordings with paid/pending totals. */
export function useObligations(kind: ObligationKind) {
  return useQuery({
    queryKey: OBLIGATION_QUERY_KEYS[kind],
    queryFn: () => fetchObligations(kind),
  });
}

/** `GET /collections/:id` | `/loans/:id` | `/debts/:id` — record with installments. */
export function useObligation(kind: ObligationKind, id: string) {
  return useQuery({
    queryKey: [...OBLIGATION_QUERY_KEYS[kind], id],
    queryFn: () => fetchObligation(kind, id),
    enabled: Boolean(id),
  });
}
