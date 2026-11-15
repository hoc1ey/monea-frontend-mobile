import { RefreshControl, StyleSheet, View } from 'react-native';

import { router } from 'expo-router';
import { WifiOff } from 'lucide-react-native';

import {
  Banner,
  Button,
  Group,
  Row,
  ScreenContainer,
  SectionHeader,
  Skeleton,
  TopBar,
} from '@/components/ui';
import { BalanceBarChart, MonthlyPairChart } from '@/features/reports/Charts';
import {
  useBalanceHistory,
  useMonthlyHistory,
  useMonthlySummary,
} from '@/features/reports/useReports';
import { formatMoney } from '@/lib/format';
import { radii, useThemeColors } from '@/theme';

/** `/reports` — monthly income/expense charts and balance history (F18). */
export default function ReportsScreen() {
  const colors = useThemeColors();
  const history = useMonthlyHistory();
  const balance = useBalanceHistory();
  const summary = useMonthlySummary();

  const queries = [history, balance];
  const isLoading = queries.some((query) => query.isPending);
  const isRefreshing = !isLoading && queries.some((query) => query.isFetching);
  const isError = queries.some((query) => query.isError);

  const refresh = () => Promise.all(queries.map((query) => query.refetch()));

  const month = summary.data;
  const monthItems = month
    ? [
        { label: 'Ingresos', value: formatMoney(month.totalIncomes) },
        { label: 'Egresos', value: formatMoney(month.totalExpenses) },
        { label: 'Neto', value: formatMoney(month.net) },
      ]
    : [];

  return (
    <>
      <TopBar title="Reportes" onBack={() => router.back()} />
      <ScreenContainer
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void refresh()}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <SectionHeader title="Este mes" />
        {summary.isPending ? (
          <Skeleton height={96} radius={radii.card} />
        ) : month ? (
          <Group>
            {monthItems.map((row, index) => (
              <Row
                key={row.label}
                title={row.label}
                value={row.value}
                showSeparator={index > 0}
              />
            ))}
          </Group>
        ) : null}

        <SectionHeader title="Ingresos y egresos" />
        {history.isPending ? (
          <Skeleton height={210} radius={radii.card} />
        ) : history.data && history.data.length > 0 ? (
          <MonthlyPairChart items={history.data} />
        ) : null}

        <SectionHeader title="Balance al cierre" />
        {balance.isPending ? (
          <Skeleton height={210} radius={radii.card} />
        ) : balance.data && balance.data.length > 0 ? (
          <BalanceBarChart items={balance.data} />
        ) : null}

        {isError ? (
          <View style={styles.error}>
            <Banner
              icon={WifiOff}
              title="Sin conexión"
              subtitle="No pudimos cargar los reportes"
              onPress={() => void refresh()}
            />
            <Button title="Reintentar" variant="ghost" onPress={() => void refresh()} />
          </View>
        ) : null}
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  error: {
    marginTop: 16,
  },
});
