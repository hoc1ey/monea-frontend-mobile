import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useThemeColors } from '@/theme';

export interface SeparatorProps {
  /** Distance from the left edge of the containing group: 14 or 60 (with leading icon). */
  inset?: number;
  style?: StyleProp<ViewStyle>;
}

export function Separator({ inset = 14, style }: SeparatorProps) {
  const colors = useThemeColors();

  return <View style={[styles.line, { left: inset, backgroundColor: colors.separator }, style]} />;
}

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
});
