import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createShoppingList, type CreateShoppingListInput } from '@/api/shoppingLists';

import { SHOPPING_QUERY_KEY } from './keys';

/** Invalidates every shopping list query (list and detail caches). */
export function invalidateShoppingLists(
  queryClient: ReturnType<typeof useQueryClient>,
): Promise<unknown> {
  return queryClient.invalidateQueries({ queryKey: SHOPPING_QUERY_KEY });
}

/** POST /shopping-lists — creates an open list with optional initial items. */
export function useCreateShoppingList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateShoppingListInput) => createShoppingList(input),
    onSuccess: () => invalidateShoppingLists(queryClient),
  });
}
