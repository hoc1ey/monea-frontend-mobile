import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { typography, useThemeColors } from '@/theme';

export interface NoteProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Informational block on `fill` background (prototype `.note`). */
export function Note({ children, style }: NoteProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.note, { backgroundColor: colors.fill }, style]}>
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text style={[styles.text, { color: colors.muted }]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  text: {
    ...typography.footnote,
    lineHeight: 18,
  },
});
