import { StyleSheet, Text, View } from 'react-native';

import { BarChart, type barDataItem } from 'react-native-gifted-charts';

import type { BalanceReportItem, MonthlyReportItem } from '@/api/reports';
import { shortMonthLabel } from '@/lib/format';
import { radii, typography, useThemeColors } from '@/theme';

/** Fixed chart viewport; 5 months always fit without horizontal scroll. */
const CHART_HEIGHT = 180;
const BAR_WIDTH = 16;
const PAIR_SPACING = 8;
const GROUP_GAP = 22;

/** Shared axis look: no y axis text or rules, plain x axis line. */
function axisProps(color: string) {
  return {
    height: CHART_HEIGHT,
    barWidth: BAR_WIDTH,
    noOfSections: 4,
    hideYAxisText: true,
    hideRules: true,
    disableScroll: true,
    isAnimated: true,
    xAxisColor: color,
    xAxisThickness: 1,
    yAxisThickness: 0,
    initialSpacing: 20,
    endSpacing: 20,
    barBorderRadius: 5,
    roundedTop: true,
    xAxisLabelTextStyle: {
      color: color,
      fontSize: 10,
      marginTop: 4,
    },
  } as const;
}

/** Legend under the pair chart. */
function Legend({ entries }: { entries: { label: string; color: string }[] }) {
  const colors = useThemeColors();

  return (
    <View style={styles.legend}>
      {entries.map((entry) => (
        <View key={entry.label} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: entry.color }]} />
          <Text style={[styles.legendText, { color: colors.muted }]}>{entry.label}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Incomes and expenses per month as side-by-side pairs (F18): green bar =
 * incomes, red bar = expenses, month label under the green bar of each pair.
 */
export function MonthlyPairChart({ items }: { items: MonthlyReportItem[] }) {
  const colors = useThemeColors();

  const data: barDataItem[] = items.flatMap((item) => [
    {
      value: item.totalIncomes,
      frontColor: colors.positive,
      label: shortMonthLabel(item.period),
      labelWidth: BAR_WIDTH + PAIR_SPACING,
    },
    {
      value: item.totalExpenses,
      frontColor: colors.negative,
    },
  ]);

  const allZero = items.every((item) => item.totalIncomes === 0 && item.totalExpenses === 0);

  return (
    <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
      <BarChart
        {...axisProps(colors.muted)}
        data={data}
        spacing={PAIR_SPACING}
        {...(allZero ? { maxValue: 100 } : {})}
      />
      <Legend
        entries={[
          { label: 'Ingresos', color: colors.positive },
          { label: 'Egresos', color: colors.negative },
        ]}
      />
    </View>
  );
}

/** Balance of all accounts at the close of each month (F18). */
export function BalanceBarChart({ items }: { items: BalanceReportItem[] }) {
  const colors = useThemeColors();

  const data: barDataItem[] = items.map((item) => ({
    value: item.balance,
    frontColor: colors.accent,
    label: shortMonthLabel(item.period),
    labelWidth: BAR_WIDTH,
  }));

  const allZero = items.every((item) => item.balance === 0);

  return (
    <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
      <BarChart
        {...axisProps(colors.muted)}
        data={data}
        spacing={GROUP_GAP}
        {...(allZero ? { maxValue: 100 } : {})}
      />
      <Legend entries={[{ label: 'Balance al cierre', color: colors.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  chartCard: {
    borderRadius: radii.card,
    paddingTop: 16,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 12,
    paddingHorizontal: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    ...typography.footnote,
  },
});
