import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { elevation, radii, typography, useThemeColors } from '@/theme';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}

export function Segmented<T extends string>({ options, value, onChange, style }: SegmentedProps<T>) {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.fill }, style]}>
      {options.map((option) => {
        const active = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && { backgroundColor: colors.surface, elevation: elevation.segmented }]}
          >
            <Text style={[styles.label, { color: colors.text }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radii.segmented,
    padding: 2,
    marginTop: 6,
    marginBottom: 16,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: radii.segmentedInner,
  },
  label: {
    ...typography.kicker,
    fontWeight: '600',
  },
});
