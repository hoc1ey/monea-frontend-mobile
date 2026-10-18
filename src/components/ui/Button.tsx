import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { ICON_STROKE, elevation, radii, typography, useThemeColors } from '@/theme';

import type { IconComponent } from './types';

export type ButtonVariant = 'primary' | 'ghost' | 'danger';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  /** Compact button (prototype `.btn.sm`). */
  small?: boolean;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: IconComponent;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  small = false,
  disabled = false,
  loading = false,
  leftIcon: LeftIcon,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const colors = useThemeColors();

  const backgroundColor =
    variant === 'primary' ? colors.accent : variant === 'ghost' ? colors.fill : 'transparent';
  const textColor =
    variant === 'primary' ? colors.onAccent : variant === 'danger' ? colors.negative : colors.accentInk;
  const shadow =
    variant === 'primary' && !small
      ? {
          shadowColor: colors.accent,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: elevation.button,
        }
      : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        small ? styles.small : styles.base,
        { backgroundColor },
        shadow,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {LeftIcon ? <LeftIcon size={small ? 16 : 20} color={textColor} strokeWidth={ICON_STROKE} /> : null}
          <Text style={[small ? styles.smallText : styles.text, { color: textColor }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    paddingVertical: 16,
    borderRadius: radii.button,
  },
  small: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  text: {
    ...typography.barTitle,
  },
  smallText: {
    ...typography.kicker,
    fontWeight: '600',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
});
