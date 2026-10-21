import { useEffect, useState } from 'react';
import { Animated } from 'react-native';

import { Image } from 'expo-image';

export interface BrandLogoProps {
  size?: number;
  /** Scale pulse between 1 and 1.06 every 1.6 s (splash screen). */
  pulse?: boolean;
}

/** MONEA mascot logo shared by the auth screens (prototype `.logo`). */
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
    <Animated.View>
      <Image
        source={require('../../../assets/images/logo.png')}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </Animated.View>
  );
}
