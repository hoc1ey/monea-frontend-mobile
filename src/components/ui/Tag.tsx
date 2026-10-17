import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { typography, useThemeColors } from '@/theme';

import type { TagVariant } from './types';

export interface TagProps {
  label: string;
  variant?: TagVariant;
  style?: StyleProp<TextStyle>;
}

export function Tag({ label, variant = 'default', style }: TagProps) {
  const colors = useThemeColors();

  const palette: Record<TagVariant, { background: string; text: string }> = {
    default: { background: colors.fill, text: colors.text },
    ok: { background: colors.positiveSoft, text: colors.positive },
    acc: { background: colors.accentSoft, text: colors.accentInk },
    neg: { background: colors.negativeSoft, text: colors.negative },
  };

  const { background, text } = palette[variant];

  return (
    <Text style={[styles.tag, { backgroundColor: background, color: text }, style]}>{label}</Text>
  );
}

const styles = StyleSheet.create({
  tag: {
    ...typography.caption,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
    overflow: 'hidden',
  },
});
