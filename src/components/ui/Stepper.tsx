import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { typography, useThemeColors } from '@/theme';

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

interface StepperButtonProps {
  symbol: string;
  label: string;
  onPress: () => void;
}

function StepperButton({ symbol, label, onPress }: StepperButtonProps) {
  const colors = useThemeColors();
  const [pressed, setPressed] = useState(false);

  return (
    <View
      style={[
        styles.button,
        { backgroundColor: colors.fill },
        pressed && styles.pressed,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={styles.hit}
      >
        <Text style={[styles.symbol, { color: colors.text }]}>{symbol}</Text>
      </Pressable>
    </View>
  );
}

export function Stepper({ value, onChange, min = 0, max, step = 1 }: StepperProps) {
  const colors = useThemeColors();

  const change = (direction: number) => {
    const next = value + direction * step;
    if (next < min) return;
    if (max != null && next > max) return;
    onChange(next);
  };

  return (
    <View style={styles.container}>
      <StepperButton symbol={'\u2212'} label="Disminuir" onPress={() => change(-1)} />
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <StepperButton symbol="+" label="Aumentar" onPress={() => change(1)} />
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
    overflow: 'hidden',
  },
  hit: {
    width: 30,
    height: 30,
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