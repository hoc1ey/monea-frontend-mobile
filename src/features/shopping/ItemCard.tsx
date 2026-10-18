import { StyleSheet, Text, View } from 'react-native';

import type { ShoppingListItem } from '@/api/shoppingLists';
import { Checkbox } from '@/components/ui';
import { radii, typography, useThemeColors } from '@/theme';

export interface ItemCardProps {
  item: ShoppingListItem;
  onToggle: () => void;
  /** Dims the card while a request for it is in flight. */
  pending?: boolean;
}

/**
 * Item card of an open shopping list (F14): a 16 radius surface with the
 * checkbox and the product name. The price field and the edit/delete actions
 * are added by the following steps of the feature.
 */
export function ItemCard({ item, onToggle, pending }: ItemCardProps) {
  const colors = useThemeColors();

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
});
