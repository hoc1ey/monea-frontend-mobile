import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { typography, useThemeColors } from '@/theme';

export interface SectionHeaderProps {
  title: string;
  /** Optional right-aligned action (usually a link). */
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Uppercase muted section header (prototype `.h-sec`). */
export function SectionHeader({ title, action, style }: SectionHeaderProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.row, style]}>
      <Text style={[styles.title, { color: colors.muted }]}>{title}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 14,
  },
  title: {
    ...typography.sectionHeader,
    textTransform: 'uppercase',
  },
});
