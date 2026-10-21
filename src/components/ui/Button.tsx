import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { ICON_STROKE, radii, useThemeColors } from '@/theme';

import type { IconComponent } from './types';

export type ButtonVariant = 'primary' | 'ghost' | 'danger';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  /** Equivale a `.btn.sm` del prototipo: auto ancho, padding 9 14, radio 12. */
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

  const isPrimary = variant === 'primary';
  const backgroundColor = isPrimary ? colors.accent : variant === 'ghost' ? colors.fill : 'transparent';
  const foregroundColor = isPrimary
    ? colors.onAccent
    : variant === 'danger'
      ? colors.negative
      : colors.accentInk;

  const inactive = disabled || loading;
  const radius = small ? 12 : radii.button;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        small ? styles.small : styles.block,
        pressed && !inactive ? styles.pressed : null,
        disabled && !loading ? styles.disabled : null,
        style,
      ]}
    >
      {/* Fondo: capa absoluta para que el color se pinte siempre */}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor, borderRadius: radius }]}
      />

      {/* Contenido: el padding y la altura viven aquí, no en el Pressable */}
      <View style={[styles.inner, small ? styles.innerSmall : styles.innerBlock]}>
        {loading ? (
          <ActivityIndicator color={foregroundColor} />
        ) : (
          <>
            {LeftIcon ? (
              <LeftIcon size={small ? 16 : 20} color={foregroundColor} strokeWidth={ICON_STROKE} />
            ) : null}
            <Text style={[small ? styles.smallText : styles.text, { color: foregroundColor }]}>{title}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // .btn: ancho 100 %, radio 16, mínimo 52
  block: {
    width: '100%',
    minHeight: 52,
    borderRadius: radii.button,
    overflow: 'hidden',
  },
  // .btn.sm: auto ancho, radio 12
  small: {
    alignSelf: 'flex-start',
    minHeight: 36,
    borderRadius: 12,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  // padding 16 vertical y horizontal
  innerBlock: {
    minHeight: 52,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  // padding 9 14
  innerSmall: {
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  text: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
});