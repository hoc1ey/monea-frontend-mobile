import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useThemeColors } from '@/theme';

export interface ProgressBarProps {
  /** Progress between 0 and 1. */
  progress: number;
  style?: StyleProp<ViewStyle>;
}

export function ProgressBar({ progress, style }: ProgressBarProps) {
  const colors = useThemeColors();
  const percentage = Math.min(100, Math.max(0, progress * 100));

  return (
    <View style={[styles.track, { backgroundColor: colors.fill }, style]}>
      <View style={[styles.fill, { width: `${percentage}%`, backgroundColor: colors.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
