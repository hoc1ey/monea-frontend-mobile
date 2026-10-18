import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';
import { ShoppingCart, WifiOff } from 'lucide-react-native';

import {
  Banner,
  Button,
  EmptyState,
  Group,
  LargeHeader,
  Note,
  Row,
  ScreenContainer,
  SectionHeader,
  Skeleton,
  TopBar,
} from '@/components/ui';
import { useAccounts } from '@/features/accounts/useAccounts';
import { formatDate, formatMoney } from '@/lib/format';
import { radii, typography, useThemeColors } from '@/theme';

import { itemsOf, purchasedCount } from './shopping';
import { useShoppingList } from './useShoppingLists';

function DetailSkeleton() {
  const colors = useThemeColors();

  return (
    <View style={[styles.skeletonGroup, { backgroundColor: colors.surface }]}>
      <Skeleton height={32} />
      <Skeleton height={32} />
      <Skeleton height={32} />
    </View>
  );
}

function ClosedDetail({
  name,
  closedAt,
  total,
  count,
  accountName,
}: {
  name: string;
  closedAt: string | null;
  total: number;
  count: number;
  accountName: string;
}) {
  const colors = useThemeColors();
  const date = closedAt ? formatDate(closedAt, "d 'de' MMMM") : '—';

  return (
    <>
      <View style={styles.closedHead}>
        <Text style={[styles.closedDate, { color: colors.muted }]}>Cerrada el {date}</Text>
        <Text style={[styles.closedTotal, { color: colors.text }]}>{formatMoney(total)}</Text>
        <Text style={[styles.closedSub, { color: colors.muted }]}>
          {count} ítems · {accountName}
        </Text>
      </View>
      <Note>
        Lista cerrada e inmutable. Se registró un egreso por el total desde {accountName}.
      </Note>
    </>
  );
}

export interface ShoppingListDetailProps {
  id: string;
}

/**
 * Shopping list detail (F14). Closed lists render an immutable summary; open
 * lists are completed by the item, price and closing sections of the feature.
 */
export function ShoppingListDetail({ id }: ShoppingListDetailProps) {
  const colors = useThemeColors();
  const query = useShoppingList(id);
  const accounts = useAccounts();

  const list = query.data;
  const items = itemsOf(list);
  const accountName =
    (list?.accountId && accounts.data?.find((account) => account.id === list.accountId)?.name) ||
    '—';

  const renderContent = () => {
    if (query.isPending) {
      return <DetailSkeleton />;
    }

    if (query.isError || !list) {
      return (
        <>
          <Banner
            icon={WifiOff}
            title="Sin conexión"
            subtitle="No pudimos cargar la lista"
            onPress={() => void query.refetch()}
          />
          <Button title="Reintentar" variant="ghost" onPress={() => void query.refetch()} />
        </>
      );
    }

    if (list.status === 'CLOSED') {
      return (
        <ClosedDetail
          name={list.name}
          closedAt={list.closedAt}
          total={list.total ?? 0}
          count={items.length}
          accountName={accountName}
        />
      );
    }

    return (
      <>
        <LargeHeader
          title={list.name}
          subtitle={`${purchasedCount(items)} de ${items.length} comprados`}
        />
        <SectionHeader title="Productos" />
        {items.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Aún no hay productos"
            message="Agrega el primero arriba."
          />
        ) : (
          <Group>
            {items.map((item) => (
              <Row key={item.id} title={item.name} />
            ))}
          </Group>
        )}
      </>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar title={list?.name ?? 'Lista'} onBack={() => router.back()} />
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
        {renderContent()}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  closedHead: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    paddingBottom: 18,
  },
  closedDate: {
    ...typography.kicker,
  },
  closedTotal: {
    ...typography.amountLarge,
  },
  closedSub: {
    ...typography.subhead,
  },
  skeletonGroup: {
    gap: 12,
    padding: 14,
    borderRadius: radii.card,
  },
});
