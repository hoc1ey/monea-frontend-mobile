import { Pressable, StyleSheet, Text, View } from 'react-native';

import { typography, useThemeColors } from '@/theme';

import { Separator } from './Separator';

export interface SelectTriggerProps {
  label: string;
  /** Label of the selected option; `undefined` falls back to the placeholder. */
  selected?: string;
  placeholder: string;
  onPress: () => void;
  showSeparator?: boolean;
}

/** Tappable row shared by `Select` and `WheelSelect` (label + right value). */
export function SelectTrigger({
  label,
  selected,
  placeholder,
  onPress,
  showSeparator,
}: SelectTriggerProps) {
  const colors = useThemeColors();

  return (
    <View>
      {showSeparator ? <Separator /> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={styles.row}
      >
        <Text style={[typography.body, { color: colors.text }]}>{label}</Text>
        <Text
          style={[
            typography.body,
            {
              fontWeight: '500',
              color: selected ? colors.accentInk : colors.muted,
              flex: 1,
              textAlign: 'right',
            },
          ]}
          numberOfLines={1}
        >
          {selected ?? placeholder}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
