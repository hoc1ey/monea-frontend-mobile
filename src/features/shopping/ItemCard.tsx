import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Pencil, Trash2 } from 'lucide-react-native';

import type { ShoppingListItem } from '@/api/shoppingLists';
import { Button, Checkbox } from '@/components/ui';
import { formatMoney, roundMoney } from '@/lib/format';
import { ICON_STROKE, radii, typography, useThemeColors } from '@/theme';

export interface ItemCardProps {
  item: ShoppingListItem;
  /** Enables the price field and the formatted price under the name. */
  pricesOn?: boolean;
  /** Required unless `readOnly`, which never modifies the item. */
  onToggle?: () => void;
  onSaveName?: (name: string) => Promise<void> | void;
  onSavePrice?: (price: number) => Promise<void> | void;
  onDelete?: () => void;
  /** Dims the card while a request for it is in flight. */
  pending?: boolean;
  /** Highlights the card in `negative` (e.g. a purchased item without price). */
  highlight?: boolean;
  /** Render for a closed list: no toggle, no editing and no delete actions. */
  readOnly?: boolean;
}

const PRICE_DEBOUNCE = 600;

/**
 * Item card of an open shopping list (F14): checkbox and name in view mode, the
 * optional price field and the edit/delete actions; the name is edited in place.
 * With `readOnly` it renders for a closed list: the state and price are shown
 * but nothing can be modified.
 */
export function ItemCard({
  item,
  pricesOn,
  onToggle,
  onSaveName,
  onSavePrice,
  onDelete,
  pending,
  highlight,
  readOnly = false,
}: ItemCardProps) {
  const colors = useThemeColors();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.name);
  const [priceDraft, setPriceDraft] = useState(item.price != null ? String(item.price) : '');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const priceFocused = useRef(false);

  useEffect(() => {
    if (!priceFocused.current) {
      setPriceDraft(item.price != null ? String(item.price) : '');
    }
  }, [item.price]);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  const startEditing = () => {
    setDraft(item.name);
    setEditing(true);
  };

  const saveName = async () => {
    const name = draft.trim();
    if (!name || name === item.name) {
      setEditing(false);
      return;
    }
    await onSaveName?.(name);
    setEditing(false);
  };

  const commitPrice = () => {
    const raw = priceDraft.trim();
    if (!raw) {
      return;
    }
    const value = roundMoney(Number(raw.replace(',', '.')));
    if (value > 0 && value !== item.price) {
      void onSavePrice?.(value);
    }
  };

  const schedulePriceSave = () => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(commitPrice, PRICE_DEBOUNCE);
  };

  if (editing) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, opacity: pending ? 0.6 : 1 }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Nombre del producto"
          placeholderTextColor={colors.muted}
          maxLength={120}
          autoFocus
          style={[styles.editInput, { backgroundColor: colors.fill, color: colors.text }]}
        />
        <Button title="Cancelar" variant="ghost" small onPress={() => setEditing(false)} />
        <Button title="Guardar" small onPress={() => void saveName()} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, opacity: pending ? 0.6 : 1 },
        highlight && { borderWidth: 1.5, borderColor: colors.negative },
      ]}
    >
      <Checkbox
        checked={item.isPurchased}
        onToggle={onToggle ?? (() => undefined)}
        disabled={pending || readOnly}
        accessibilityLabel={item.name}
      />
      <View style={styles.text}>
        <Text
          style={[
            styles.name,
            { color: item.isPurchased ? colors.muted : colors.text },
            item.isPurchased && styles.purchased,
          ]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        {(pricesOn || readOnly) && item.price != null ? (
          <Text style={[styles.price, { color: colors.muted }]}>{formatMoney(item.price)}</Text>
        ) : null}
      </View>
      {pricesOn && !readOnly ? (
        <TextInput
          value={priceDraft}
          onChangeText={setPriceDraft}
          onFocus={() => {
            priceFocused.current = true;
          }}
          onBlur={() => {
            priceFocused.current = false;
            schedulePriceSave();
          }}
          placeholder="$0.00"
          placeholderTextColor={colors.muted}
          keyboardType="decimal-pad"
          inputMode="decimal"
          style={[styles.priceInput, { backgroundColor: colors.fill, color: colors.text }]}
        />
      ) : null}
      {!readOnly ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Editar ${item.name}`}
            onPress={startEditing}
            style={styles.iconButton}
          >
            <Pencil size={18} color={colors.accentInk} strokeWidth={ICON_STROKE} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Eliminar ${item.name}`}
            onPress={onDelete}
            style={styles.iconButton}
          >
            <Trash2 size={18} color={colors.negative} strokeWidth={ICON_STROKE} />
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radii.listItem,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    elevation: 0,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...typography.bodyMedium,
  },
  purchased: {
    textDecorationLine: 'line-through',
  },
  price: {
    ...typography.footnote,
    marginTop: 1,
  },
  priceInput: {
    width: 96,
    borderRadius: radii.icon,
    paddingVertical: 7,
    paddingHorizontal: 8,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  editInput: {
    ...typography.body,
    flex: 1,
    minWidth: 0,
    borderRadius: radii.icon,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  iconButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
