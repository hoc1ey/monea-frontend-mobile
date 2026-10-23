import { Pressable, StyleSheet } from 'react-native';

import { ChevronLeft } from 'lucide-react-native';

import { ICON_STROKE, useThemeColors } from '@/theme';

export interface BackButtonProps {
  onPress: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
}

export function BackButton({
  onPress,
  accessibilityLabel = 'Atrás',
  disabled = false,
}: BackButtonProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.fill },
        disabled && styles.disabled,
        pressed && { opacity: 0.8 },
      ]}
    >
      <ChevronLeft size={20} color={colors.accentInk} strokeWidth={ICON_STROKE} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});
