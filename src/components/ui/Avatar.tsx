import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { useThemeColors } from '@/theme';

export interface AvatarProps {
  name: string;
  /** Circle diameter; 38 for lists, 64 for detail, 96 for the profile. */
  size?: number;
  /** Gradient fill with white text (profile avatar). */
  gradient?: boolean;
  style?: StyleProp<ViewStyle>;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({ name, size = 38, gradient = false, style }: AvatarProps) {
  const colors = useThemeColors();
  const fontSize = size >= 96 ? 36 : size >= 64 ? 22 : 14;
  const textStyle = [styles.text, { fontSize, lineHeight: fontSize + 4 }];

  if (gradient) {
    return (
      <LinearGradient
        colors={[colors.accent, colors.accentInk]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }, style]}
      >
        <Text style={[...textStyle, { color: colors.white }]}>{getInitials(name)}</Text>
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.accentSoft,
        },
        style,
      ]}
    >
      <Text style={[...textStyle, { color: colors.accentInk }]}>{getInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
});
