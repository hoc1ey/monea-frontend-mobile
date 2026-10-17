import { useEffect, useState } from 'react';
import { Animated, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';

import { radii, useThemeColors } from '@/theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Pulsing placeholder block (opacity 0.5 ↔ 1 over 1200 ms). */
export function Skeleton({ width = '100%', height = 16, radius = radii.icon, style }: SkeletonProps) {
  const colors = useThemeColors();
  const [opacity] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: colors.fill, opacity }, style]}
    />
  );
}
