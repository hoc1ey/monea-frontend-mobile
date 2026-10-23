import { Pressable, StyleSheet, Text, View } from 'react-native';

import { typography, useThemeColors } from '@/theme';

import { Separator } from './Separator';

export interface SelectTriggerProps {
  label: string;
  /** Label of the selected option; `undefined` falls back to the placeholder. */
  selected?: string;
  placeholder: string;
  onPress: () => void;
  /** Renders a red "Quitar" action once there is a selected value. */
  onClear?: () => void;
  showSeparator?: boolean;
}

/** Tappable row shared by `Select` and `WheelSelect` (label + right value). */
export function SelectTrigger({
  label,
  selected,
  placeholder,
  onPress,
  onClear,
  showSeparator,
}: SelectTriggerProps) {
  const colors = useThemeColors();
  const clearable = onClear !== undefined && selected !== undefined;

  return (
    <View>
      {showSeparator ? <Separator /> : null}
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onPress}
          style={({ pressed }) => [styles.main, pressed && styles.pressed]}
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
        {clearable ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Quitar ${label.toLowerCase()}`}
            hitSlop={8}
            onPress={onClear}
          >
            <Text style={[styles.clear, { color: colors.negative }]}>Quitar</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  main: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clear: {
    ...typography.subhead,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.6,
  },
});
