import type { ShoppingList, ShoppingListItem } from '@/api/shoppingLists';
import type { SegmentedOption } from '@/components/ui';
import { roundMoney, sumMoney } from '@/lib/format';

/** Route slug of the shopping screen (`shopping/[tab]`). */
export type ShoppingTab = 'open' | 'closed';

export const SHOPPING_TABS: SegmentedOption<ShoppingTab>[] = [
  { value: 'open', label: 'Abiertas' },
  { value: 'closed', label: 'Cerradas' },
];

export function isShoppingTab(value: unknown): value is ShoppingTab {
  return value === 'open' || value === 'closed';
}

/** Maps the UI tab to the `status` query accepted by `GET /shopping-lists`. */
export function statusForTab(tab: ShoppingTab): 'OPEN' | 'CLOSED' {
  return tab === 'open' ? 'OPEN' : 'CLOSED';
}

/** Active items of a list (the API never returns logically deleted ones). */
export function itemsOf(list: ShoppingList | undefined): ShoppingListItem[] {
  return list?.items ?? [];
}

/** Number of items marked as purchased. */
export function purchasedCount(items: ShoppingListItem[]): number {
  return items.filter((item) => item.isPurchased).length;
}

/** Progress between 0 and 1 (0 while the list has no items). */
export function listProgress(items: ShoppingListItem[]): number {
  return items.length === 0 ? 0 : purchasedCount(items) / items.length;
}

/** Sum of the prices of the purchased items, rounded to 2 decimals. */
export function sumPurchasedPrices(items: ShoppingListItem[]): number {
  return sumMoney(
    items
      .filter((item) => item.isPurchased && typeof item.price === 'number')
      .map((item) => item.price as number),
  );
}

/** Single purchaser's missing prices, in list order. */
export function purchasedWithoutPrice(items: ShoppingListItem[]): ShoppingListItem[] {
  return items.filter(
    (item) => item.isPurchased && !(typeof item.price === 'number' && item.price > 0),
  );
}

/** Effectively rounds a manual total coming from the input. */
export function parseTotal(value: string): number {
  return roundMoney(Number(value) || 0);
}
