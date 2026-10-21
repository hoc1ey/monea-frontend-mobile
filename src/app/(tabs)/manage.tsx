import { RefreshControl, StyleSheet, View } from 'react-native';

import { router } from 'expo-router';
import { ArrowDown, ArrowUp, Landmark, ShoppingCart, WifiOff } from 'lucide-react-native';

import { Fab } from '@/components/navigation/Fab';
import {
  Banner,
  Group,
  LargeHeader,
  Row,
  ScreenContainer,
  SectionHeader,
  Skeleton,
} from '@/components/ui';
import { ManageSummary } from '@/features/manage/ManageSummary';
import { useManageOverview } from '@/features/manage/useManageOverview';
import { formatMoney } from '@/lib/format';
import { useUiStore } from '@/stores/ui';
import { radii, useThemeColors } from '@/theme';

function ManageSkeleton() {
  const colors = useThemeColors();

  return (
    <View style={[styles.skeletonGroup, { backgroundColor: colors.surface }]}>
      <Skeleton height={32} />
      <Skeleton height={32} />
      <Skeleton height={32} />
    </View>
  );
}

/** `/manage` — hub of collections, loans, debts and shopping lists (F15). */
export default function ManageScreen() {
  const colors = useThemeColors();
  const openQuickActions = useUiStore((state) => state.openQuickActions);
  const overview = useManageOverview();
  const { collections, loans, debts, shopping } = overview;

  return (
    <View style={styles.flex}>
      <ScreenContainer
        refreshControl={
          <RefreshControl
            refreshing={overview.isRefreshing}
            onRefresh={() => void overview.refetch()}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <LargeHeader title="Gestión" subtitle="Lo que te deben, lo que debes y tus compras" />

        <ManageSummary
          toCollect={overview.toCollect}
          toPay={overview.toPay}
          collectCount={collections.active}
          payCount={loans.active + debts.active}
        />

        {overview.isError ? (
          <Banner
            icon={WifiOff}
            title="Sin conexión"
            subtitle="No pudimos cargar tus totales"
            onPress={() => void overview.refetch()}
            style={styles.banner}
          />
        ) : null}

        <SectionHeader title="Cobros y préstamos" />
        {overview.isLoading ? (
          <ManageSkeleton />
        ) : (
          <Group>
            <Row
              icon={ArrowDown}
              title="Cobros"
              subtitle={`${collections.active} activos · por cobrar ${formatMoney(collections.pending)}`}
              onPress={() =>
                router.push({ pathname: '/obligations/[tab]', params: { tab: 'cobros' } })
              }
            />
            <Row
              icon={Landmark}
              title="Préstamos"
              subtitle={`${loans.active} activos · por pagar ${formatMoney(loans.pending)}`}
              onPress={() =>
                router.push({ pathname: '/obligations/[tab]', params: { tab: 'prestamos' } })
              }
            />
            <Row
              icon={ArrowUp}
              title="Deudas"
              subtitle={`${debts.active} activas · pendiente ${formatMoney(debts.pending)}`}
              onPress={() =>
                router.push({ pathname: '/obligations/[tab]', params: { tab: 'deudas' } })
              }
            />
          </Group>
        )}

        <SectionHeader title="Compras" />
        {overview.isLoading ? (
          <ManageSkeleton />
        ) : (
          <Group>
            <Row
              icon={ShoppingCart}
              title="Listas de compras"
              subtitle={`${shopping.open} abiertas · ${shopping.closed} cerradas`}
              onPress={() =>
                router.push({ pathname: '/shopping/[tab]', params: { tab: 'open' } })
              }
            />
          </Group>
        )}
      </ScreenContainer>
      <Fab onPress={openQuickActions} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  banner: {
    marginTop: 16,
  },
  skeletonGroup: {
    gap: 12,
    padding: 14,
    borderRadius: radii.card,
  },
});
