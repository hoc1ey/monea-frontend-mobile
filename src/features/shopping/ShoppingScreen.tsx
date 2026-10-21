import { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';
import { ChevronRight, ShoppingCart, WifiOff } from 'lucide-react-native';

import type { ShoppingList } from '@/api/shoppingLists';
import {
  Banner,
  Button,
  EmptyState,
  Group,
  ProgressBar,
  Row,
  ScreenContainer,
  Segmented,
  Skeleton,
  TopBar,
} from '@/components/ui';
import { useAccounts } from '@/features/accounts/useAccounts';
import { formatDate, formatMoney } from '@/lib/format';
import { ICON_STROKE, radii, useThemeColors } from '@/theme';

import { itemsOf, listProgress, purchasedCount, SHOPPING_TABS, type ShoppingTab } from './shopping';
import { useShoppingLists } from './useShoppingLists';

function ListSkeleton() {
  const colors = useThemeColors();

  return (
    <View style={[styles.skeletonGroup, { backgroundColor: colors.surface }]}>
      <Skeleton height={72} radius={radii.card} />
      <Skeleton height={72} radius={radii.card} />
    </View>
  );
}

/** Open list card with its live progress (prototype `.card` inside `S.shopping`). */
function OpenListCard({ list, onPress }: { list: ShoppingList; onPress: () => void }) {
  const colors = useThemeColors();
  const [pressed, setPressed] = useState(false);
  const items = itemsOf(list);
  const done = purchasedCount(items);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface },
        pressed && styles.cardPressed,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={list.name}
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
            {list.name}
          </Text>
          <ChevronRight size={14} color={colors.muted} strokeWidth={ICON_STROKE} />
        </View>
        <Text style={[styles.cardSubtitle, { color: colors.muted }]}>
          {done} de {items.length} comprados
        </Text>
        <ProgressBar progress={listProgress(items)} style={styles.cardProgress} />
      </Pressable>
    </View>
  );
}

function ClosedListRow({
  list,
  accountName,
  onPress,
}: {
  list: ShoppingList;
  accountName: string;
  onPress: () => void;
}) {
  const items = itemsOf(list);
  const date = list.closedAt ? formatDate(list.closedAt, 'd MMM') : '—';
  const total = formatMoney(list.total ?? 0);

  return (
    <Row
      icon={ShoppingCart}
      title={list.name}
      subtitle={`${date} · ${items.length} ítems · ${accountName}`}
      value={total}
      onPress={onPress}
    />
  );
}

export interface ShoppingScreenProps {
  tab: ShoppingTab;
}

/**
 * Shopping lists hub (F14): "Abiertas" and "Cerradas" tabs swap the content in
 * place (only the container changes), with cards with progress for the open
 * ones and rows with the closing summary for the closed.
 */
export function ShoppingScreen({ tab }: ShoppingScreenProps) {
  const colors = useThemeColors();
  const query = useShoppingLists(tab);
  const accounts = useAccounts();

  const lists = query.data ?? [];
  const accountNames = new Map((accounts.data ?? []).map((account) => [account.id, account.name]));

  const changeTab = (next: ShoppingTab) => router.setParams({ tab: next });

  const openNew = () => router.push('/shopping/new');

  const openDetail = (id: string) =>
    router.push({ pathname: '/shopping/[tab]/[id]', params: { tab, id } });

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
            subtitle="No pudimos cargar tus listas"
            onPress={() => void query.refetch()}
          />
          <Button title="Reintentar" variant="ghost" onPress={() => void query.refetch()} />
        </>
      );
    }

    if (lists.length === 0) {
      return tab === 'open' ? (
        <EmptyState
          icon={ShoppingCart}
          title="Aún no hay listas abiertas"
          message="Crea una lista para empezar a organizar tus compras."
          actionLabel="Nueva lista"
          onAction={openNew}
        />
      ) : (
        <EmptyState
          icon={ShoppingCart}
          title="Aún no hay listas cerradas"
          message="Cuando cierres una lista aparecerá aquí."
        />
      );
    }

    if (tab === 'open') {
      return (
        <>
          {lists.map((list) => (
            <OpenListCard key={list.id} list={list} onPress={() => openDetail(list.id)} />
          ))}
          <View style={styles.newButton}>
            <Button title="Nueva lista" variant="ghost" onPress={openNew} />
          </View>
        </>
      );
    }

    return (
      <Group>
        {lists.map((list) => (
          <ClosedListRow
            key={list.id}
            list={list}
            accountName={(list.accountId && accountNames.get(list.accountId)) || '—'}
            onPress={() => openDetail(list.id)}
          />
        ))}
      </Group>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar title="Compras" onBack={() => router.back()} />
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
        <View style={styles.segmentWrap}>
          <Segmented options={SHOPPING_TABS} value={tab} onChange={changeTab} />
        </View>
        {renderContent()}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  segmentWrap: {
    paddingTop: 12,
  },
  card: {
    borderRadius: radii.card,
    padding: 16,
    marginBottom: 12,
  },
  cardPressed: {
    opacity: 0.8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    flex: 1,
    minWidth: 0,
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  cardProgress: {
    marginTop: 12,
  },
  newButton: {
    marginTop: 21,
  },
  skeletonGroup: {
    gap: 12,
    padding: 14,
    borderRadius: radii.card,
  },
});