import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { radii, typography, useThemeColors } from '@/theme';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

export interface ChipsProps<T extends string> {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function Chips<T extends string>({ options, value, onChange }: ChipsProps<T>) {
  const colors = useThemeColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.accent : colors.surface,
              },
            ]}
          >
            <Text style={[styles.label, { color: active ? colors.onAccent : colors.text }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 8,
    paddingBottom: 14,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
  },
  label: {
    ...typography.kicker,
    fontWeight: '500',
  },
});
