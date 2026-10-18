import { api, type ApiEnvelope } from './client';

export type ShoppingListStatus = 'OPEN' | 'CLOSED';

/** Product inside a shopping list; `price` is null until it is set. */
export interface ShoppingListItem {
  id: string;
  userId: string;
  listId: string;
  name: string;
  isPurchased: boolean;
  price: number | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Shopping list as returned by the API, optionally with its active items. */
export interface ShoppingList {
  id: string;
  userId: string;
  name: string;
  status: ShoppingListStatus;
  /** ISO UTC instant the list was closed; null while it is open. */
  closedAt: string | null;
  /** Total registered when the list was closed; null while it is open. */
  total: number | null;
  /** Account of the generated expense once closed. */
  accountId: string | null;
  /** Expense generated when the list was closed. */
  expenseId: string | null;
  items?: ShoppingListItem[];
  createdAt?: string;
  updatedAt?: string;
}

/** Body accepted by `POST /shopping-lists` (never includes `userId`). */
export interface CreateShoppingListInput {
  name: string;
  items?: { name: string }[];
}

/** Body accepted by `PATCH /shopping-lists/:id/items/:itemId`. */
export interface UpdateShoppingListItemInput {
  name?: string;
  /** Must be greater than 0. */
  price?: number;
}

/** Body accepted by `POST /shopping-lists/:id/close` (never includes `userId`). */
export interface CloseShoppingListInput {
  accountId: string;
  purchasedItems: { id: string; price?: number }[];
  notPurchasedItems?: { id: string }[];
  total?: number;
}

/** Result of closing a list: the closed list and the pending-items list. */
export interface CloseShoppingListResult {
  closedList: ShoppingList;
  newList: ShoppingList | null;
}

/** GET /shopping-lists?status= — lists with their active items. */
export async function getShoppingLists(status?: ShoppingListStatus): Promise<ShoppingList[]> {
  const { data } = await api.get<ApiEnvelope<ShoppingList[]>>('/shopping-lists', {
    params: { status },
  });
  return data.data;
}

/** GET /shopping-lists/:id — single list with its active items. */
export async function getShoppingList(id: string): Promise<ShoppingList> {
  const { data } = await api.get<ApiEnvelope<ShoppingList>>(`/shopping-lists/${id}`);
  return data.data;
}

/** POST /shopping-lists — creates an open list with optional initial items. */
export async function createShoppingList(input: CreateShoppingListInput): Promise<ShoppingList> {
  const { data } = await api.post<ApiEnvelope<ShoppingList>>('/shopping-lists', input);
  return data.data;
}

/** PATCH /shopping-lists/:id — renames an open list. */
export async function renameShoppingList(id: string, name: string): Promise<ShoppingList> {
  const { data } = await api.patch<ApiEnvelope<ShoppingList>>(`/shopping-lists/${id}`, { name });
  return data.data;
}

/** DELETE /shopping-lists/:id — logical delete of the list and its items. */
export async function deleteShoppingList(id: string): Promise<void> {
  await api.delete<ApiEnvelope<null>>(`/shopping-lists/${id}`);
}

/** POST /shopping-lists/:id/items — adds an item to an open list. */
export async function addShoppingListItem(id: string, name: string): Promise<ShoppingListItem> {
  const { data } = await api.post<ApiEnvelope<ShoppingListItem>>(`/shopping-lists/${id}/items`, {
    name,
  });
  return data.data;
}

/** PATCH /shopping-lists/:id/items/:itemId — renames and/or sets the price. */
export async function updateShoppingListItem(
  id: string,
  itemId: string,
  input: UpdateShoppingListItemInput,
): Promise<ShoppingListItem> {
  const { data } = await api.patch<ApiEnvelope<ShoppingListItem>>(
    `/shopping-lists/${id}/items/${itemId}`,
    input,
  );
  return data.data;
}

/** PATCH /shopping-lists/:id/items/:itemId/check — marks the item as purchased. */
export async function checkShoppingListItem(
  id: string,
  itemId: string,
  isPurchased: boolean,
): Promise<ShoppingListItem> {
  const { data } = await api.patch<ApiEnvelope<ShoppingListItem>>(
    `/shopping-lists/${id}/items/${itemId}/check`,
    { isPurchased },
  );
  return data.data;
}

/** DELETE /shopping-lists/:id/items/:itemId — removes an item from an open list. */
export async function deleteShoppingListItem(id: string, itemId: string): Promise<void> {
  await api.delete<ApiEnvelope<null>>(`/shopping-lists/${id}/items/${itemId}`);
}

/** POST /shopping-lists/:id/close — creates the expense and moves pending items. */
export async function closeShoppingList(
  id: string,
  input: CloseShoppingListInput,
): Promise<CloseShoppingListResult> {
  const { data } = await api.post<ApiEnvelope<CloseShoppingListResult>>(
    `/shopping-lists/${id}/close`,
    input,
  );
  return data.data;
}
