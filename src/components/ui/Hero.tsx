import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { elevation, radii, typography, useThemeColors } from '@/theme';

export interface HeroFooterRow {
  label: string;
  value: string;
}

export interface HeroProps {
  label: string;
  value: string;
  footer?: HeroFooterRow[];
  /** Compact variant (prototype `.hero.sm`). */
  small?: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Balance block with a 135° gradient and a clipped decorative circle. */
export function Hero({ label, value, footer, small = false, children, style }: HeroProps) {
  const colors = useThemeColors();

  return (
    <LinearGradient
      colors={[colors.heroA, colors.heroB]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[small ? styles.small : styles.base, style]}
    >
      <View
        style={[
          styles.decor,
          { backgroundColor: colors.overlayHero },
          small ? styles.decorSmall : styles.decorLarge,
        ]}
      />
      <Text style={[styles.label, { color: colors.heroText }]}>{label}</Text>
      <Text style={[small ? styles.valueSmall : styles.value, { color: colors.heroText }]}>{value}</Text>
      {children}
      {footer?.map((row) => (
        <View key={row.label} style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.heroText }]}>{row.label}</Text>
          <Text style={[styles.footerValue, { color: colors.heroText }]}>{row.value}</Text>
        </View>
      ))}
    </LinearGradient>
  );
}

export function HeroSm(props: HeroProps) {
  return <Hero small {...props} />;
}

const styles = StyleSheet.create({
  base: {
    padding: 20,
    borderRadius: radii.hero,
    overflow: 'hidden',
    elevation: elevation.hero,
  },
  small: {
    padding: 16,
    borderRadius: radii.heroSm,
    overflow: 'hidden',
    elevation: elevation.hero,
  },
  decor: {
    position: 'absolute',
    borderRadius: 999,
  },
  decorLarge: {
    width: 200,
    height: 200,
    right: -70,
    top: -80,
  },
  decorSmall: {
    width: 160,
    height: 160,
    right: -60,
    top: -70,
  },
  label: {
    ...typography.kicker,
    opacity: 0.85,
  },
  value: {
    ...typography.hero,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  valueSmall: {
    ...typography.heroSm,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    opacity: 0.95,
  },
  footerText: {
    ...typography.kicker,
  },
  footerValue: {
    ...typography.kicker,
    fontWeight: '600',
  },
});
