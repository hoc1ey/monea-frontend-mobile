import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Pencil, Trash2 } from 'lucide-react-native';

import type { ShoppingListItem } from '@/api/shoppingLists';
import { Button, Checkbox } from '@/components/ui';
import { ICON_STROKE, radii, typography, useThemeColors } from '@/theme';

export interface ItemCardProps {
  item: ShoppingListItem;
  onToggle: () => void;
  onSaveName: (name: string) => Promise<void> | void;
  onDelete: () => void;
  /** Dims the card while a request for it is in flight. */
  pending?: boolean;
}

/**
 * Item card of an open shopping list (F14): checkbox and name in view mode,
 * with the edit and delete actions; the name is edited in place.
 */
export function ItemCard({ item, onToggle, onSaveName, onDelete, pending }: ItemCardProps) {
  const colors = useThemeColors();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.name);

  const startEditing = () => {
    setDraft(item.name);
    setEditing(true);
  };

  const save = async () => {
    const name = draft.trim();
    if (!name || name === item.name) {
      setEditing(false);
      return;
    }
    await onSaveName(name);
    setEditing(false);
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
        <Button title="Guardar" small onPress={() => void save()} />
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, opacity: pending ? 0.6 : 1 }]}>
      <Checkbox
        checked={item.isPurchased}
        onToggle={onToggle}
        disabled={pending}
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
      </View>
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
