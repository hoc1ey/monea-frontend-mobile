/** Shared cache key for the shopping lists list and every detail query. */
export const SHOPPING_QUERY_KEY = ['shopping-lists'] as const;

/** Key of the list filtered by status (`OPEN` / `CLOSED`). */
export function shoppingListsKey(status: string): readonly unknown[] {
  return [...SHOPPING_QUERY_KEY, 'list', status];
}

/** Key of a single list detail. */
export function shoppingListKey(id: string): readonly unknown[] {
  return [...SHOPPING_QUERY_KEY, 'detail', id];
}
