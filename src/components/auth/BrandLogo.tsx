import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { palette } from '@/theme';

export interface BrandLogoProps {
  size?: number;
  /** Scale pulse between 1 and 1.06 every 1.6 s (splash screen). */
  pulse?: boolean;
}

/** Gradient "M" badge shared by the auth screens (prototype `.logo`). */
export function BrandLogo({ size = 76, pulse = false }: BrandLogoProps) {
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!pulse) {
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.06, duration: 800, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();

    return () => loop.stop();
  }, [pulse, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <LinearGradient
        colors={[palette.cerise[500], palette.cerise[900]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.logo, { width: size, height: size, borderRadius: size * 0.316 }]}
      >
        <Text style={[styles.letter, { fontSize: size * 0.474 }]}>M</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  logo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
