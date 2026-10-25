import { Pressable, StyleSheet, Text, View } from 'react-native';

import { typography, useThemeColors } from '@/theme';

import { Separator } from './Separator';

export interface SelectTriggerProps {
  label: string;
  selected?: string;
  placeholder: string;
  onPress: () => void;
  onClear?: () => void;
  showSeparator?: boolean;
}

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
          style={styles.pressable}
        >
          {({ pressed }) => (
            <View style={[styles.content, pressed && styles.pressed]}>
              <Text style={[typography.body, { color: colors.text }]}>{label}</Text>
              <Text
                numberOfLines={1}
                style={[
                  typography.body,
                  {
                    fontWeight: '500',
                    color: selected ? colors.accentInk : colors.muted,
                    flex: 1,
                    textAlign: 'right',
                  },
                ]}
              >
                {selected ?? placeholder}
              </Text>
            </View>
          )}
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
  // El Pressable solo ocupa el espacio; no lleva layout propio.
  pressable: {
    flex: 1,
    minWidth: 0,
  },
  // El layout real vive en un View.
  content: {
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
