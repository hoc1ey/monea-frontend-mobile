import { Pressable, StyleSheet, Text, View } from 'react-native';

import { typography, useThemeColors } from '@/theme';

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function Stepper({ value, onChange, min = 0, max, step = 1 }: StepperProps) {
  const colors = useThemeColors();

  const change = (direction: number) => {
    const next = value + direction * step;
    if (next < min) return;
    if (max != null && next > max) return;
    onChange(next);
  };

  const renderButton = (symbol: string, direction: number, label: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => change(direction)}
      style={({ pressed }) => [styles.button, { backgroundColor: colors.fill }, pressed && styles.pressed]}
    >
      <Text style={[styles.symbol, { color: colors.text }]}>{symbol}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {renderButton('\u2212', -1, 'Disminuir')}
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      {renderButton('+', 1, 'Aumentar')}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  button: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    fontSize: 18,
    lineHeight: 22,
  },
  value: {
    ...typography.body,
    fontWeight: '600',
    minWidth: 18,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  pressed: {
    opacity: 0.7,
  },
});
