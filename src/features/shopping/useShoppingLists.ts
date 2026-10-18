import { useQuery } from '@tanstack/react-query';

import { getShoppingList, getShoppingLists } from '@/api/shoppingLists';

import { shoppingListKey, shoppingListsKey } from './keys';
import { statusForTab, type ShoppingTab } from './shopping';

/** `GET /shopping-lists?status=` — lists with their active items. */
export function useShoppingLists(tab: ShoppingTab) {
  const status = statusForTab(tab);
  return useQuery({
    queryKey: shoppingListsKey(status),
    queryFn: () => getShoppingLists(status),
  });
}

/** `GET /shopping-lists/:id` — single list with its active items. */
export function useShoppingList(id: string) {
  return useQuery({
    queryKey: shoppingListKey(id),
    queryFn: () => getShoppingList(id),
    enabled: Boolean(id),
  });
}
