import { RefreshControl, StyleSheet, View } from 'react-native';

import { router } from 'expo-router';
import { ArrowDown, ArrowUp, Landmark, WifiOff } from 'lucide-react-native';

import {
  Banner,
  Button,
  EmptyState,
  Group,
  HeroSm,
  LargeHeader,
  ScreenContainer,
  SectionHeader,
  Segmented,
  Skeleton,
  TopBar,
  type IconComponent,
} from '@/components/ui';
import { formatMoney } from '@/lib/format';
import { radii, useThemeColors } from '@/theme';

import {
  OBLIGATION_KIND_CONFIG,
  OBLIGATION_TABS,
  sumPending,
  toObligationView,
  type ObligationKind,
} from './obligations';
import { ObligationRow } from './ObligationRow';
import { useObligations } from './useObligations';

const KIND_ICON: Record<ObligationKind, IconComponent> = {
  cobros: ArrowDown,
  prestamos: Landmark,
  deudas: ArrowUp,
};

function ListSkeleton() {
  const colors = useThemeColors();

  return (
    <View style={[styles.skeletonGroup, { backgroundColor: colors.surface }]}>
      <Skeleton height={32} />
      <Skeleton height={32} />
      <Skeleton height={32} />
    </View>
  );
}

export interface ObligationScreenProps {
  tab: ObligationKind;
}

/**
 * Obligations hub: a 3-way segment (collections / loans / debts) with the
 * pending total hero, the active rows and the "Nuevo registro" action.
 */
export function ObligationScreen({ tab }: ObligationScreenProps) {
  const colors = useThemeColors();
  const config = OBLIGATION_KIND_CONFIG[tab];
  const query = useObligations(tab);

  const items = (query.data ?? []).map(toObligationView);

  const changeTab = (next: ObligationKind) =>
    router.replace({ pathname: '/obligations/[tab]', params: { tab: next } });

  const openNew = () =>
    router.push({ pathname: '/obligations/[tab]/new', params: { tab } });

  const openDetail = (id: string) =>
    router.push({ pathname: '/obligations/[tab]/[id]', params: { tab, id } });

  const renderContent = () => {
    if (query.isPending) {
      return <ListSkeleton />;
    }

    if (query.isError) {
      return (
        <>
          <Banner
            icon={WifiOff}
            title="Sin conexión"
            subtitle={`No pudimos cargar tus ${config.plural.toLowerCase()}`}
            onPress={() => void query.refetch()}
          />
          <Button title="Reintentar" variant="ghost" onPress={() => void query.refetch()} />
        </>
      );
    }

    if (items.length === 0) {
      return (
        <EmptyState
          icon={KIND_ICON[tab]}
          title={`No tienes registros en ${config.plural.toLowerCase()}`}
          message="Registra un nuevo movimiento para hacerle seguimiento aquí."
          actionLabel="Nuevo registro"
          onAction={openNew}
        />
      );
    }

    return (
      <>
        <SectionHeader title="Activos" />
        <Group>
          {items.map((item) => (
            <ObligationRow
              key={item.id}
              obligation={item}
              onPress={() => openDetail(item.id)}
            />
          ))}
        </Group>
        <Button
          title="Nuevo registro"
          variant="ghost"
          onPress={openNew}
          style={styles.newButton}
        />
      </>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar onBack={() => router.back()} />
      <ScreenContainer
        refreshControl={
          <RefreshControl
            refreshing={!query.isPending && query.isFetching}
            onRefresh={() => void query.refetch()}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <LargeHeader title={config.plural} subtitle="Cuotas y recordatorios" />
        <Segmented options={OBLIGATION_TABS} value={tab} onChange={changeTab} />
        <HeroSm label="Pendiente total" value={formatMoney(sumPending(items))} />
        {renderContent()}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  newButton: {
    marginTop: 14,
  },
  skeletonGroup: {
    gap: 12,
    padding: 14,
    borderRadius: radii.card,
    marginTop: 12,
  },
});
