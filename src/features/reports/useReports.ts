import { useQuery } from '@tanstack/react-query';

import { getBalanceHistory, getMonthlyHistory, getMonthlySummary } from '@/api/reports';

/** F18 reports: fixed 5-month window, no pagination. */
const STALE_TIME = 60_000;

/** Incomes, expenses and net of the current month. */
export function useMonthlySummary() {
  return useQuery({
    queryKey: ['reports', 'monthly-summary'],
    queryFn: getMonthlySummary,
    staleTime: STALE_TIME,
  });
}

/** Monthly incomes/expenses for the current month + 4 previous (oldest first). */
export function useMonthlyHistory() {
  return useQuery({
    queryKey: ['reports', 'monthly-history'],
    queryFn: getMonthlyHistory,
    staleTime: STALE_TIME,
  });
}

/** Balance at the close of the current month + 4 previous (oldest first). */
export function useBalanceHistory() {
  return useQuery({
    queryKey: ['reports', 'balance-history'],
    queryFn: getBalanceHistory,
    staleTime: STALE_TIME,
  });
}
