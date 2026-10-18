import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  addShoppingListItem,
  checkShoppingListItem,
  closeShoppingList,
  createShoppingList,
  deleteShoppingList,
  deleteShoppingListItem,
  renameShoppingList,
  updateShoppingListItem,
  type CloseShoppingListInput,
  type CreateShoppingListInput,
  type ShoppingList,
  type ShoppingListItem,
  type UpdateShoppingListItemInput,
} from '@/api/shoppingLists';

import { SHOPPING_QUERY_KEY, shoppingListKey } from './keys';

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

/** POST /shopping-lists/:id/items — adds an item to an open list. */
export function useAddShoppingListItem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => addShoppingListItem(id, name),
    onSuccess: () => invalidateShoppingLists(queryClient),
  });
}

interface CheckVariables {
  itemId: string;
  isPurchased: boolean;
}

interface CheckContext {
  previousDetail?: ShoppingList;
}

/**
 * PATCH /shopping-lists/:id/items/:itemId/check — marks an item as purchased
 * optimistically so the checkbox reacts immediately; rolls back on error.
 */
export function useCheckShoppingListItem(id: string) {
  const queryClient = useQueryClient();
  return useMutation<ShoppingListItem, Error, CheckVariables, CheckContext>({
    mutationFn: ({ itemId, isPurchased }) => checkShoppingListItem(id, itemId, isPurchased),
    onMutate: async ({ itemId, isPurchased }) => {
      const key = shoppingListKey(id);
      await queryClient.cancelQueries({ queryKey: key });

      const previousDetail = queryClient.getQueryData<ShoppingList>(key);
      queryClient.setQueryData<ShoppingList>(key, (old) =>
        old
          ? {
              ...old,
              items: old.items?.map((item) =>
                item.id === itemId ? { ...item, isPurchased } : item,
              ),
            }
          : old,
      );

      return { previousDetail };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousDetail !== undefined) {
        queryClient.setQueryData(shoppingListKey(id), context.previousDetail);
      }
    },
    onSettled: () => invalidateShoppingLists(queryClient),
  });
}

interface UpdateItemVariables {
  itemId: string;
  input: UpdateShoppingListItemInput;
}

/** PATCH /shopping-lists/:id/items/:itemId — renames or sets the price. */
export function useUpdateShoppingListItem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, input }: UpdateItemVariables) =>
      updateShoppingListItem(id, itemId, input),
    onSuccess: () => invalidateShoppingLists(queryClient),
  });
}

/** DELETE /shopping-lists/:id/items/:itemId — removes an item from an open list. */
export function useDeleteShoppingListItem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => deleteShoppingListItem(id, itemId),
    onSuccess: () => invalidateShoppingLists(queryClient),
  });
}

/**
 * PATCH /shopping-lists/:id — renames an open list.
 */
export function useRenameShoppingList(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => renameShoppingList(id, name),
    onSuccess: () => invalidateShoppingLists(queryClient),
  });
}

/**
 * DELETE /shopping-lists/:id — logical delete of the list and its items.
 */
export function useDeleteShoppingList(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteShoppingList(id),
    onSuccess: () => invalidateShoppingLists(queryClient),
  });
}

/**
 * POST /shopping-lists/:id/close — creates the expense and moves the pending
 * items to a new list. The accounts and the movements change too.
 */
export function useCloseShoppingList(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CloseShoppingListInput) => closeShoppingList(id, input),
    onSuccess: () =>
      Promise.all([
        invalidateShoppingLists(queryClient),
        queryClient.invalidateQueries({ queryKey: ['accounts'] }),
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
      ]),
  });
}