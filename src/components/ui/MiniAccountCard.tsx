import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { elevation, radii, typography, useThemeColors } from '@/theme';

export interface MiniAccountCardProps {
  name: string;
  institution: string;
  balance: string;
  /** Account color from the API. */
  color: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Horizontal mini account card (prototype `.mini`), 200 dp wide. */
export function MiniAccountCard({
  name,
  institution,
  balance,
  color,
  onPress,
  style,
}: MiniAccountCardProps) {
  const colors = useThemeColors();

  const content = (
    <>
      <View style={[styles.bar, { backgroundColor: color }]} />
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
        {name}
      </Text>
      <Text style={[styles.institution, { color: colors.muted }]} numberOfLines={1}>
        {institution}
      </Text>
      <Text style={[styles.balance, { color: colors.text }]}>{balance}</Text>
    </>
  );

  if (!onPress) {
    return <View style={[styles.card, { backgroundColor: colors.surface }, style]}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface },
        pressed && { opacity: 0.9 },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    padding: 14,
    borderRadius: radii.miniCard,
    elevation: elevation.miniCard,
  },
  bar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 12,
  },
  name: {
    ...typography.subhead,
    fontWeight: '600',
  },
  institution: {
    ...typography.caption,
    fontWeight: '400',
  },
  balance: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
});
