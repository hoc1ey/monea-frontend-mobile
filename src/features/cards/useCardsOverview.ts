import { useQueries, useQuery } from '@tanstack/react-query';

import { getCreditCardDebt, getCreditCards, type CreditCard, type CreditCardDebt } from '@/api/creditCards';
import { sumMoney } from '@/lib/format';

import { CREDIT_CARDS_QUERY_KEY } from './keys';

export interface CardOverviewItem {
  card: CreditCard;
  /** Debt/credit summary; `undefined` until its query resolves. */
  debt?: CreditCardDebt;
}

export interface CardsOverview {
  items: CardOverviewItem[];
  /** Σ `currentDebt` across every card. */
  totalDebt: number;
  /** Σ (`creditLimit − currentDebt − upcoming`) across every card. */
  availableTotal: number;
  isLoading: boolean;
  isRefreshing: boolean;
  isError: boolean;
  refetch: () => Promise<unknown>;
}

/**
 * Cards list plus their debt summary, used by the "Tarjetas" segment of the
 * accounts screen. Loads lazily with `enabled` so the accounts tab does not
 * trigger card requests.
 */
export function useCardsOverview(enabled = true): CardsOverview {
  const cardsQuery = useQuery({
    queryKey: CREDIT_CARDS_QUERY_KEY,
    queryFn: getCreditCards,
    enabled,
  });

  const cards = cardsQuery.data ?? [];

  const debtQueries = useQueries({
    queries: cards.map((card) => ({
      queryKey: ['credit-cards', card.id, 'debt'],
      queryFn: () => getCreditCardDebt(card.id),
      enabled,
    })),
  });

  const items: CardOverviewItem[] = cards.map((card, index) => ({
    card,
    debt: debtQueries[index]?.data,
  }));

  const queries = [cardsQuery, ...debtQueries];

  return {
    items,
    totalDebt: sumMoney(items.map((item) => item.debt?.currentDebt ?? 0)),
    availableTotal: sumMoney(
      items.map((item) =>
        item.debt ? item.debt.creditLimit - item.debt.currentDebt - item.debt.upcoming : 0,
      ),
    ),
    isLoading: cardsQuery.isPending,
    isRefreshing: !cardsQuery.isPending && queries.some((query) => query.isFetching),
    isError: queries.some((query) => query.isError),
    refetch: () => Promise.all(queries.map((query) => query.refetch())),
  };
}
