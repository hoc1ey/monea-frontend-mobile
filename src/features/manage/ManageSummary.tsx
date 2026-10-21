import { StyleSheet, Text, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { formatMoney } from '@/lib/format';
import { elevation, radii, typography, useThemeColors } from '@/theme';

export interface ManageSummaryProps {
  /** Σ pending of collections ("Por cobrar"). */
  toCollect: number;
  /** Σ pending of loans + debts ("Por pagar"). */
  toPay: number;
  /** Collections not fully paid. */
  collectCount: number;
  /** Loans + debts not fully paid. */
  payCount: number;
}

interface SummaryColumnProps {
  label: string;
  value: number;
  detail: string;
}

function SummaryColumn({ label, value, detail }: SummaryColumnProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.column, { backgroundColor: colors.overlayCardStrong }]}>
      <View style={styles.labelRow}>
        <View style={[styles.dot, { backgroundColor: colors.heroText }]} />
        <Text style={[styles.label, { color: colors.heroText }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        numberOfLines={1}
        style={[styles.value, { color: colors.heroText }]}
      >
        {formatMoney(value)}
      </Text>
      <Text style={[styles.detail, { color: colors.heroText }]} numberOfLines={1}>
        {detail}
      </Text>
    </View>
  );
}

/**
 * Manage hub summary (F15): two equal-weight totals over the hero gradient and
 * a bar whose segments are proportional to the collect/pay amounts.
 */
export function ManageSummary({ toCollect, toPay, collectCount, payCount }: ManageSummaryProps) {
  const colors = useThemeColors();
  const total = toCollect + toPay;
  const collectShare = total > 0 ? toCollect / total : 0;
  const payShare = total > 0 ? toPay / total : 0;

  return (
    <LinearGradient
      colors={[colors.heroA, colors.heroB]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.columns}>
        <SummaryColumn
          label="Por cobrar"
          value={toCollect}
          detail={`${collectCount} ${collectCount === 1 ? 'cobro activo' : 'cobros activos'}`}
        />
        <SummaryColumn
          label="Por pagar"
          value={toPay}
          detail={`${payCount} ${payCount === 1 ? 'registro activo' : 'registros activos'}`}
        />
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Proporción entre lo que se cobra y lo que se paga"
        style={[styles.track, { backgroundColor: colors.overlayTrack }]}
      >
        <View
          style={[
            styles.segment,
            { width: `${collectShare * 100}%` as `${number}%`, backgroundColor: colors.heroText },
          ]}
        />
        <View
          style={[
            styles.segment,
            { width: `${payShare * 100}%` as `${number}%`, backgroundColor: colors.overlayMuted },
          ]}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: 16,
    borderRadius: radii.hero,
    overflow: 'hidden',
    elevation: elevation.hero,
  },
  columns: {
    flexDirection: 'row',
    gap: 10,
  },
  column: {
    flex: 1,
    minWidth: 0,
    minHeight: 104,
    padding: 14,
    borderRadius: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    ...typography.footnote,
    flexShrink: 1,
    fontWeight: '500',
  },
  value: {
    marginTop: 10,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  detail: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    opacity: 0.85,
  },
  track: {
    flexDirection: 'row',
    height: 6,
    marginTop: 12,
    borderRadius: 3,
    overflow: 'hidden',
  },
  segment: {
    height: '100%',
  },
});
