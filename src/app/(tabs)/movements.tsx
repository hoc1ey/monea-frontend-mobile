import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
  type ListRenderItemInfo,
} from 'react-native';

import { router } from 'expo-router';
import { ArrowUpDown, Repeat, Search, WifiOff, X } from 'lucide-react-native';

import {
  Banner,
  Button,
  Chips,
  EmptyState,
  Group,
  LargeHeader,
  Row,
  SectionHeader,
  Skeleton,
  Tag,
  type ChipOption,
  type IconComponent,
} from '@/components/ui';
import { Fab } from '@/components/navigation/Fab';
import { useAccounts } from '@/features/accounts/useAccounts';
import {
  movementIcon,
  type Movement,
  type MovementFilter,
  type MovementSection,
} from '@/features/movements/movements';
import { useMovements, usePendingExpenses } from '@/features/movements/useMovements';
import { formatDate, formatMoney } from '@/lib/format';
import { useUiStore } from '@/stores/ui';
import { ICON_STROKE, radii, spacing, typography, useThemeColors } from '@/theme';

const FILTERS: ChipOption<MovementFilter>[] = [
  { value: 'all', label: 'Todos' },
  { value: 'income', label: 'Ingresos' },
  { value: 'expense', label: 'Egresos' },
  { value: 'deferred', label: 'Diferidos' },
  { value: 'recurring', label: 'Recurrentes' },
];

/**
 * Fixed heights for `getItemLayout` (F16): every section is
 * `SectionHeader` (24 + 18 + 8) + `Group` (4 bottom margin) + `data.length`
 * rows (12 + 22 + 1 + 18 + 12 each).
 */
const SECTION_HEADER_HEIGHT = spacing.xl + typography.sectionHeader.lineHeight + spacing.sm;
const GROUP_GAP = spacing.xs;
const ROW_HEIGHT = spacing.md * 2 + typography.bodyMedium.lineHeight + 1 + typography.footnote.lineHeight;

/** Height of one section item (header + rows + group gap). */
function sectionHeight(section: MovementSection): number {
  return SECTION_HEADER_HEIGHT + GROUP_GAP + section.data.length * ROW_HEIGHT;
}

/** 36 dp circular `fill` icon-button (prototype `.ib`). */
function IconButton({
  icon: Icon,
  label,
  onPress,
}: {
  icon: IconComponent;
  label: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: colors.fill },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Icon size={20} color={colors.accentInk} strokeWidth={ICON_STROKE} />
    </Pressable>
  );
}

function MovementRow({ movement, accountName }: { movement: Movement; accountName: string }) {
  const colors = useThemeColors();
  const income = movement.kind === 'income';

  const open = () => {
    if (movement.pending) {
      router.push('/recurring/define-amount');
      return;
    }
    if (movement.deferred) {
      router.push({ pathname: '/movements/deferred/[id]', params: { id: movement.id } });
      return;
    }
    router.push({ pathname: '/movements/[id]', params: { id: movement.id, kind: movement.kind } });
  };

  return (
    <Row
      icon={movementIcon(movement)}
      title={movement.name}
      subtitle={`${accountName || '—'} · ${movement.origin}`}
      onPress={open}
      right={
        movement.pending ? (
          <Tag label="Definir monto" variant="acc" />
        ) : (
          <Text
            style={[styles.amount, { color: income ? colors.positive : colors.text }]}
          >
            {income ? '+' : '−'}
            {formatMoney(movement.amount)}
          </Text>
        )
      }
    />
  );
}

function MovementsSkeleton() {
  const colors = useThemeColors();

  return (
    <View>
      {[0, 1].map((index) => (
        <View key={index}>
          <Skeleton width="30%" height={14} style={styles.skeletonHeader} />
          <View style={[styles.skeletonGroup, { backgroundColor: colors.surface }]}>
            <Skeleton height={32} />
            <Skeleton height={32} />
            <Skeleton height={32} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function MovementsScreen() {
  const colors = useThemeColors();
  const openQuickActions = useUiStore((state) => state.openQuickActions);

  const [filter, setFilter] = useState<MovementFilter>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [headerHeight, setHeaderHeight] = useState(0);

  const movements = useMovements(filter, search);
  const pending = usePendingExpenses();
  const accounts = useAccounts();

  const accountNames = useMemo(
    () => new Map((accounts.data ?? []).map((account) => [account.id, account.name])),
    [accounts.data],
  );

  const pendingList = pending.data ?? [];
  const showBanner = filter !== 'income' && pendingList.length > 0;
  const bannerExpense = pendingList[0];

  const refresh = useCallback(() => {
    void movements.refetch();
    void pending.refetch();
    void accounts.refetch();
  }, [movements, pending, accounts]);

  const renderSection = ({ item }: ListRenderItemInfo<MovementSection>) => (
    <View>
      <SectionHeader title={item.title} />
      <Group>
        {item.data.map((movement) => (
          <MovementRow
            key={movement.id}
            movement={movement}
            accountName={accountNames.get(movement.accountId) ?? ''}
          />
        ))}
      </Group>
    </View>
  );

  const handleHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    setHeaderHeight((current) => (current === next ? current : next));
  }, []);

  const getItemLayout = useCallback(
    (data: ArrayLike<MovementSection> | null | undefined, index: number) => {
      const sections = data ?? [];
      let offset = headerHeight;
      for (let i = 0; i < index; i += 1) {
        offset += sectionHeight(sections[i]);
      }
      return { length: sectionHeight(sections[index]), offset, index };
    },
    [headerHeight],
  );

  const header = (
    <View onLayout={handleHeaderLayout}>
      <LargeHeader
        title="Movimientos"
        right={
          <IconButton
            icon={searchOpen ? X : Search}
            label={searchOpen ? 'Cerrar búsqueda' : 'Buscar'}
            onPress={() => {
              setSearchOpen((open) => !open);
              if (searchOpen) {
                setSearch('');
              }
            }}
          />
        }
      />
      {searchOpen ? (
        <View style={[styles.search, { backgroundColor: colors.fill }]}>
          <Search size={18} color={colors.muted} strokeWidth={ICON_STROKE} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nombre"
            placeholderTextColor={colors.muted}
            autoFocus
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
      ) : null}

      <Chips options={FILTERS} value={filter} onChange={setFilter} />

      {showBanner && bannerExpense ? (
        <Banner
          icon={Repeat}
          title={`${pendingList.length} egreso necesita monto`}
          subtitle={`${bannerExpense.name} · ${formatDate(bannerExpense.date, 'd MMM')}`}
          onPress={() => router.push('/recurring/define-amount')}
        />
      ) : null}

      {filter === 'recurring' ? (
        <Button
          title="Ver egresos recurrentes"
          variant="ghost"
          onPress={() => router.push('/recurring')}
        />
      ) : null}
    </View>
  );

  const empty = () => {
    if (movements.isLoading) {
      return <MovementsSkeleton />;
    }
    if (movements.isError) {
      return (
        <>
          <Banner
            icon={WifiOff}
            title="Sin conexión"
            subtitle="No pudimos cargar tus movimientos"
            onPress={refresh}
          />
          <Button title="Reintentar" variant="ghost" onPress={refresh} />
        </>
      );
    }
    return (
      <EmptyState
        icon={ArrowUpDown}
        title="Sin movimientos"
        message="Registra tu primer ingreso o egreso con el botón +."
      />
    );
  };

  const footer = movements.isFetchingNextPage ? (
    <View style={styles.footer}>
      <Skeleton height={44} radius={radii.button} />
    </View>
  ) : null;

  return (
    <View style={styles.flex}>
      <FlatList
        data={movements.sections}
        keyExtractor={(section) => section.data[0]?.id ?? section.title}
        renderItem={renderSection}
        getItemLayout={getItemLayout}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={footer}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        onEndReached={movements.hasNextPage ? movements.fetchNextPage : undefined}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={movements.isRefreshing}
            onRefresh={refresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      />
      <Fab onPress={openQuickActions} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 150,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: radii.field,
    marginBottom: 12,
  },
  searchInput: {
    ...typography.body,
    flex: 1,
    minWidth: 0,
    padding: 0,
  },
  amount: {
    ...typography.body,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  footer: {
    marginTop: 14,
    gap: 12,
  },
  skeletonHeader: {
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 14,
  },
  skeletonGroup: {
    gap: 12,
    padding: 14,
    borderRadius: radii.card,
  },
});
