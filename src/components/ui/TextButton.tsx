import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { typography, useThemeColors } from '@/theme';

export interface TextButtonProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Plain `accent-ink` text button (prototype `.tbtn`), used for bar actions like "Guardar". */
export function TextButton({ title, onPress, disabled, style }: TextButtonProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.text, { color: colors.accentInk }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  text: {
    ...typography.barTitle,
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.4,
  },
});
