import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { formatMoney } from '@/lib/format';
import { mixHexColor } from '@/lib/color';
import { palette, radii, typography, useThemeColors } from '@/theme';

export interface CreditCardVisualProps {
  name: string;
  issuer: string;
  last4: string;
  /** Base card color (from the API). */
  color: string;
  /** Overrides the derived gradient end (`color` mixed 35% with cerise-950). */
  gradientEnd?: string;
  /** Period debt shown at the bottom left. */
  debt?: number;
  /** Compact variant (prototype `.ccard` small). */
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function CreditCardVisual({
  name,
  issuer,
  last4,
  color,
  gradientEnd,
  debt,
  small = false,
  style,
}: CreditCardVisualProps) {
  const colors = useThemeColors();
  const end = gradientEnd ?? mixHexColor(color, palette.cerise[950], 0.35);

  return (
    <LinearGradient
      colors={[color, end]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[small ? styles.small : styles.base, style]}
    >
      <View style={[styles.decorStrong, { backgroundColor: colors.overlayCardStrong }]} />
      <View style={[styles.decorSoft, { backgroundColor: colors.overlayCardSoft }]} />
      <Text style={[styles.name, { color: colors.heroText }]}>{name}</Text>
      <Text style={[styles.number, { color: colors.heroText }]}>{`•••• •••• •••• ${last4}`}</Text>
      <View style={styles.footer}>
        <View>
          <Text style={[styles.footerLabel, { color: colors.heroText }]}>Deuda del periodo</Text>
          <Text style={[small ? styles.amountSmall : styles.amount, { color: colors.heroText }]}>
            {debt != null ? formatMoney(debt) : '—'}
          </Text>
        </View>
        <Text style={[styles.footerLabel, { color: colors.heroText }]}>{issuer}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 172,
    padding: 18,
    borderRadius: radii.creditCard,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  small: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radii.creditCard,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  decorStrong: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    right: -90,
    top: -100,
  },
  decorSoft: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    left: -60,
    bottom: -90,
  },
  name: {
    ...typography.subhead,
    fontWeight: '600',
    opacity: 0.95,
  },
  number: {
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerLabel: {
    ...typography.caption,
    opacity: 0.85,
  },
  amount: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  amountSmall: {
    ...typography.body,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
