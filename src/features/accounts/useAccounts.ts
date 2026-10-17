import { useQuery } from '@tanstack/react-query';

import { getAccounts } from '@/api/accounts';

/** Shared cache key for the accounts list; the F05 dashboard reads it as `['accounts']`. */
export const ACCOUNTS_QUERY_KEY = ['accounts'] as const;

/** `GET /accounts` — accounts with their derived `currentBalance`, `createdAt` DESC. */
export function useAccounts() {
  return useQuery({ queryKey: ACCOUNTS_QUERY_KEY, queryFn: getAccounts });
}
