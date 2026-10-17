import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

import { elevation, radii, useThemeColors } from '@/theme';

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

const TRACK_WIDTH = 51;
const TRACK_HEIGHT = 31;
const KNOB_SIZE = 27;
const TRAVEL = TRACK_WIDTH - KNOB_SIZE - 4;

/** Custom 51 × 31 switch (prototype `.sw`) with a 44 dp minimum touch target. */
export function Switch({ value, onValueChange, disabled, accessibilityLabel }: SwitchProps) {
  const colors = useThemeColors();
  const [progress] = useState(() => new Animated.Value(value ? 1 : 0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [progress, value]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRAVEL],
  });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={styles.hit}
    >
      <Animated.View style={[styles.track, { backgroundColor: colors.fill }]}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.positive, opacity: progress, borderRadius: radii.switchTrack },
          ]}
        />
        <Animated.View
          style={[
            styles.knob,
            {
              backgroundColor: colors.white,
              transform: [{ translateX }],
              shadowColor: colors.shadow,
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    height: 44,
    justifyContent: 'center',
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: radii.switchTrack,
  },
  knob: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    elevation: elevation.switch,
    shadowOpacity: 0.25,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
  },
});
