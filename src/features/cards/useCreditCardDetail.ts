import { useQuery } from '@tanstack/react-query';

import { isApiError } from '@/api/client';
import { getCreditCard, getCreditCardDebt, getCreditCardReport } from '@/api/creditCards';

import { retryCard } from './retry';

/** Card detail: the card, its debt/credit summary and the selected statement. */
export function useCreditCardDetail(id: string, period: string) {
  const cardQuery = useQuery({
    queryKey: ['credit-cards', id],
    queryFn: () => getCreditCard(id),
    enabled: Boolean(id),
    retry: retryCard,
  });

  const debtQuery = useQuery({
    queryKey: ['credit-cards', id, 'debt'],
    queryFn: () => getCreditCardDebt(id),
    enabled: Boolean(id),
  });

  const reportQuery = useQuery({
    queryKey: ['credit-cards', id, 'report', period],
    queryFn: () => getCreditCardReport(id, period),
    enabled: Boolean(id) && Boolean(period),
  });

  const queries = [cardQuery, debtQuery, reportQuery];

  return {
    card: cardQuery.data,
    debt: debtQuery.data,
    report: reportQuery.data,
    isLoading: queries.some((query) => query.isPending),
    isRefreshing: !queries.some((query) => query.isPending) && queries.some((query) => query.isFetching),
    isError: queries.some((query) => query.isError),
    isNotFound: isApiError(cardQuery.error) && cardQuery.error.status === 404,
    refetch: () => Promise.all(queries.map((query) => query.refetch())),
  };
}
