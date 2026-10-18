import type { ShoppingListItem } from '@/api/shoppingLists';

import {
  buildCloseInput,
  listProgress,
  parseTotal,
  purchasedCount,
  purchasedWithoutPrice,
  sumPurchasedPrices,
} from './shopping';

function item(partial: Partial<ShoppingListItem> & { id: string }): ShoppingListItem {
  return {
    userId: 'u1',
    listId: 'l1',
    name: partial.id,
    isPurchased: false,
    price: null,
    ...partial,
  };
}

const items: ShoppingListItem[] = [
  item({ id: 'a', name: 'Leche', isPurchased: true, price: 1.5 }),
  item({ id: 'b', name: 'Pan', isPurchased: true, price: 2.25 }),
  item({ id: 'c', name: 'Huevos', isPurchased: false, price: 3.99 }),
  item({ id: 'd', name: 'Arroz', isPurchased: false, price: null }),
];

describe('list totals and progress', () => {
  it('counts only the purchased items', () => {
    expect(purchasedCount(items)).toBe(2);
    expect(listProgress(items)).toBeCloseTo(2 / 4);
    expect(listProgress([])).toBe(0);
  });

  it('sums only the prices of the purchased items', () => {
    expect(sumPurchasedPrices(items)).toBe(3.75);
    expect(sumPurchasedPrices([item({ id: 'x', isPurchased: true, price: null })])).toBe(0);
  });

  it('lists purchased items missing a positive price in list order', () => {
    const withMissing = [
      item({ id: 'a', name: 'Leche', isPurchased: true, price: 1.5 }),
      item({ id: 'b', name: 'Pan', isPurchased: true, price: null }),
      item({ id: 'c', name: 'Huevos', isPurchased: true, price: 0 }),
      item({ id: 'd', name: 'Arroz', isPurchased: false, price: null }),
    ];

    expect(purchasedWithoutPrice(withMissing).map((entry) => entry.id)).toEqual(['b', 'c']);
  });

  it('parses a manual total rounding to two decimals', () => {
    expect(parseTotal('45.8')).toBe(45.8);
    expect(parseTotal('10,5')).toBe(0);
    expect(parseTotal('')).toBe(0);
    expect(parseTotal('12.345')).toBe(12.35);
  });
});

describe('buildCloseInput (XOR rule)', () => {
  it('rejects closing without a purchased item', () => {
    const result = buildCloseInput(
      items.map((entry) => ({ ...entry, isPurchased: false })),
      false,
      '45.8',
      'acc1',
    );

    expect(result).toEqual({ ok: false, error: 'Marca al menos un producto como comprado' });
  });

  it('sends prices (no total) when individual prices are on', () => {
    const result = buildCloseInput(items, true, '', 'acc1');

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.input.total).toBeUndefined();
    expect(result.input.purchasedItems).toEqual([
      { id: 'a', price: 1.5 },
      { id: 'b', price: 2.25 },
    ]);
    expect(result.input.notPurchasedItems).toEqual([{ id: 'c' }, { id: 'd' }]);
  });

  it('flags the first purchased item without price when prices are on', () => {
    const withMissing = [
      item({ id: 'a', name: 'Leche', isPurchased: true, price: 1.5 }),
      item({ id: 'b', name: 'Pan', isPurchased: true, price: null }),
    ];

    const result = buildCloseInput(withMissing, true, '', 'acc1');
    expect(result).toEqual({ ok: false, error: 'Falta el precio de «Pan»', highlightItemId: 'b' });
  });

  it('requires a manual total greater than zero when prices are off', () => {
    expect(buildCloseInput(items, false, '0', 'acc1')).toEqual({
      ok: false,
      error: 'Escribe el total de la compra',
    });

    const result = buildCloseInput(items, false, '45.8', 'acc1');
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.input.total).toBe(45.8);
    expect(result.input.purchasedItems).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(result.input.notPurchasedItems).toEqual([{ id: 'c' }, { id: 'd' }]);
  });

  it('omits notPurchasedItems when every item is purchased', () => {
    const allPurchased = items.map((entry) => ({ ...entry, isPurchased: true }));
    const result = buildCloseInput(allPurchased, false, '10', 'acc1');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input.notPurchasedItems).toBeUndefined();
  });
});
