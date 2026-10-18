import { useQueries } from '@tanstack/react-query';

import type { Collection, Debt, Loan } from '@/api/obligations';
import { getCollections, getDebts, getLoans } from '@/api/obligations';
import { getShoppingLists } from '@/api/shoppingLists';
import { sumMoney } from '@/lib/format';

import { shoppingListsKey } from '@/features/shopping/keys';

/** Aggregated counters and totals shown by the manage hub (F15). */
export interface ManageObligationSummary {
  /** Records not fully paid. */
  active: number;
  /** Σ `pendingAmount`. */
  pending: number;
}

export interface ManageOverview {
  isLoading: boolean;
  isRefreshing: boolean;
  isError: boolean;
  /** Σ pending of collections ("Por cobrar"). */
  toCollect: number;
  /** Σ pending of loans + debts ("Por pagar"). */
  toPay: number;
  collections: ManageObligationSummary;
  loans: ManageObligationSummary;
  debts: ManageObligationSummary;
  shopping: { open: number; closed: number };
  refetch: () => Promise<unknown>;
}

function summarizeObligations(
  records: (Collection | Loan | Debt)[],
): ManageObligationSummary {
  return {
    active: records.filter((record) => record.status !== 'PAID').length,
    pending: sumMoney(records.map((record) => record.pendingAmount ?? 0)),
  };
}

/**
 * Aggregates the manage hub: collections, loans, debts and open/closed shopping
 * list counters. Shares the cache keys used by the home dashboard so the data
 * is reused when it is already cached.
 */
export function useManageOverview(): ManageOverview {
  const [collectionsQuery, loansQuery, debtsQuery, openListsQuery, closedListsQuery] = useQueries({
    queries: [
      { queryKey: ['collections'], queryFn: () => getCollections() },
      { queryKey: ['loans'], queryFn: () => getLoans() },
      { queryKey: ['debts'], queryFn: () => getDebts() },
      { queryKey: shoppingListsKey('OPEN'), queryFn: () => getShoppingLists('OPEN') },
      { queryKey: shoppingListsKey('CLOSED'), queryFn: () => getShoppingLists('CLOSED') },
    ],
  });

  const queries = [collectionsQuery, loansQuery, debtsQuery, openListsQuery, closedListsQuery];

  const collections = summarizeObligations(collectionsQuery.data ?? []);
  const loans = summarizeObligations(loansQuery.data ?? []);
  const debts = summarizeObligations(debtsQuery.data ?? []);

  return {
    isLoading: queries.some((query) => query.isPending),
    isRefreshing: !queries.some((query) => query.isPending) && queries.some((query) => query.isFetching),
    isError: queries.some((query) => query.isError),
    toCollect: collections.pending,
    toPay: sumMoney([loans.pending, debts.pending]),
    collections,
    loans,
    debts,
    shopping: {
      open: (openListsQuery.data ?? []).length,
      closed: (closedListsQuery.data ?? []).length,
    },
    refetch: () => Promise.all(queries.map((query) => query.refetch())),
  };
}
