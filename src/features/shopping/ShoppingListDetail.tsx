import { useRef, useState } from 'react';
import { Alert, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import { router } from 'expo-router';
import { ShoppingCart, WifiOff } from 'lucide-react-native';

import { isApiError } from '@/api/client';
import type { CloseShoppingListInput, ShoppingListItem } from '@/api/shoppingLists';
import {
  Banner,
  Button,
  EmptyState,
  Field,
  Group,
  LargeHeader,
  Note,
  Row,
  ScreenContainer,
  SectionHeader,
  Skeleton,
  Switch,
  TextButton,
  TopBar,
  useToast,
} from '@/components/ui';
import { useAccounts } from '@/features/accounts/useAccounts';
import { formatDate, formatMoney } from '@/lib/format';
import { radii, typography, useThemeColors } from '@/theme';

import { ItemCard } from './ItemCard';
import { CloseListSheet } from './CloseListSheet';
import { RenameListSheet } from './RenameListSheet';
import { itemsOf, purchasedCount, sumPurchasedPrices } from './shopping';
import {
  useAddShoppingListItem,
  useCheckShoppingListItem,
  useCloseShoppingList,
  useDeleteShoppingListItem,
  useDeleteShoppingList,
  useRenameShoppingList,
  useUpdateShoppingListItem,
} from './useShoppingListMutations';
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
  closedAt,
  total,
  count,
  accountName,
}: {
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
 * lists get the product entry, the item cards and the totals section.
 */
export function ShoppingListDetail({ id }: ShoppingListDetailProps) {
  const colors = useThemeColors();
  const toast = useToast();
  const query = useShoppingList(id);
  const accounts = useAccounts();
  const addItem = useAddShoppingListItem(id);
  const checkItem = useCheckShoppingListItem(id);
  const updateItem = useUpdateShoppingListItem(id);
  const deleteItem = useDeleteShoppingListItem(id);
  const closeList = useCloseShoppingList(id);
  const renameList = useRenameShoppingList(id);
  const deleteList = useDeleteShoppingList(id);

  const [newName, setNewName] = useState('');
  const [pendingItems, setPendingItems] = useState<{ tempId: string; name: string }[]>([]);
  const [pricesOn, setPricesOn] = useState(false);
  const [manualTotal, setManualTotal] = useState('');
  const [closing, setClosing] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [highlightItemId, setHighlightItemId] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const list = query.data;
  const items = itemsOf(list);
  const purchasedTotal = sumPurchasedPrices(items);
  const accountName =
    (list?.accountId && accounts.data?.find((account) => account.id === list.accountId)?.name) ||
    '—';

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) {
      return;
    }

    const tempId = `pending-${Date.now()}`;
    setPendingItems((previous) => [...previous, { tempId, name }]);
    setNewName('');
    inputRef.current?.focus();

    try {
      await addItem.mutateAsync(name.slice(0, 120));
      setPendingItems((previous) => previous.filter((pending) => pending.tempId !== tempId));
    } catch (error) {
      setPendingItems((previous) => previous.filter((pending) => pending.tempId !== tempId));
      toast.show(isApiError(error) ? error.message : 'No se pudo agregar el producto');
    }
  };

  const handleToggle = (itemId: string, isPurchased: boolean) => {
    checkItem.mutate({ itemId, isPurchased });
  };

  const handleSaveName = async (itemId: string, name: string) => {
    try {
      await updateItem.mutateAsync({ itemId, input: { name } });
    } catch (error) {
      toast.show(isApiError(error) ? error.message : 'No se pudo guardar el producto');
    }
  };

  const handleSavePrice = async (itemId: string, price: number) => {
    try {
      await updateItem.mutateAsync({ itemId, input: { price } });
      setHighlightItemId((current) => (current === itemId ? null : current));
    } catch (error) {
      toast.show(isApiError(error) ? error.message : 'No se pudo guardar el precio');
    }
  };

  const handleDelete = (item: ShoppingListItem) => {
    Alert.alert('Eliminar producto', `Se quitará «${item.name}» de la lista.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem.mutateAsync(item.id);
          } catch (error) {
            toast.show(isApiError(error) ? error.message : 'No se pudo quitar el producto');
          }
        },
      },
    ]);
  };

  const handleCloseConfirm = async (input: CloseShoppingListInput) => {
    try {
      const result = await closeList.mutateAsync(input);
      setClosing(false);
      toast.show('Lista cerrada · egreso creado');
      if (result.newList) {
        const pending = itemsOf(result.newList).length;
        setTimeout(() => toast.show(`Se creó una lista con ${pending} pendientes`), 2200);
      }
      router.replace({ pathname: '/shopping/[tab]', params: { tab: 'open' } });
    } catch (error) {
      toast.show(isApiError(error) ? error.message : 'No se pudo cerrar la lista');
    }
  };

  const handleRename = async (name: string) => {
    try {
      await renameList.mutateAsync(name);
      setRenaming(false);
      toast.show('Lista renombrada');
    } catch (error) {
      toast.show(isApiError(error) ? error.message : 'No se pudo renombrar la lista');
    }
  };

  const handleDeleteList = () => {
    if (!list) {
      return;
    }
    Alert.alert('Eliminar lista', `Se eliminará «${list.name}» y sus productos.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteList.mutateAsync();
            toast.show('Lista eliminada');
            router.replace({ pathname: '/shopping/[tab]', params: { tab: 'open' } });
          } catch (error) {
            toast.show(isApiError(error) ? error.message : 'No se pudo eliminar la lista');
          }
        },
      },
    ]);
  };

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

        <Group>
          <Row
            title="Precios individuales"
            subtitle="Suma cada precio y calcula el total"
            right={
              <Switch
                value={pricesOn}
                onValueChange={setPricesOn}
                accessibilityLabel="Precios individuales"
              />
            }
          />
        </Group>

        <SectionHeader title="Productos" />
        <View style={[styles.addRow, { backgroundColor: colors.surface }]}>
          <TextInput
            ref={inputRef}
            value={newName}
            onChangeText={setNewName}
            placeholder="Agregar producto"
            placeholderTextColor={colors.muted}
            maxLength={120}
            returnKeyType="done"
            onSubmitEditing={() => void handleAdd()}
            style={[styles.addInput, { color: colors.text }]}
          />
          <Button title="Agregar" small onPress={() => void handleAdd()} disabled={!newName.trim()} />
        </View>

        {pendingItems.map((pending) => (
          <View
            key={pending.tempId}
            style={[styles.pendingCard, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.pendingName, { color: colors.muted }]} numberOfLines={1}>
              {pending.name}
            </Text>
          </View>
        ))}

        {items.length === 0 && pendingItems.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Aún no hay productos"
            message="Agrega el primero arriba."
          />
        ) : (
          items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              pricesOn={pricesOn}
              highlight={highlightItemId === item.id}
              onToggle={() => handleToggle(item.id, !item.isPurchased)}
              onSaveName={(name) => handleSaveName(item.id, name)}
              onSavePrice={(price) => handleSavePrice(item.id, price)}
              onDelete={() => handleDelete(item)}
            />
          ))
        )}

        <SectionHeader title="Total de la compra" />
        <Group>
          <Field
            label="Total"
            right={
              pricesOn ? (
                <Text style={[styles.totalValue, { color: colors.muted }]}>
                  {formatMoney(purchasedTotal)}
                </Text>
              ) : (
                <TextInput
                  value={manualTotal}
                  onChangeText={setManualTotal}
                  placeholder="0.00"
                  placeholderTextColor={colors.muted}
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  style={[styles.totalValue, { color: colors.text }]}
                />
              )
            }
          />
        </Group>
        <Note>
          {pricesOn
            ? 'El total se calcula sumando los precios de cada producto.'
            : 'Escribe el total de la compra. Activa precios individuales para calcularlo.'}
        </Note>

        <Button title="Cerrar lista" onPress={() => setClosing(true)} style={styles.close} />

        <Group>
          <Button
            title="Eliminar lista"
            variant="danger"
            loading={deleteList.isPending}
            onPress={handleDeleteList}
          />
        </Group>
      </>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar
        title={list?.name ?? 'Lista'}
        onBack={() => router.back()}
        right={
          list?.status === 'OPEN' ? (
            <TextButton title="Editar" onPress={() => setRenaming(true)} />
          ) : undefined
        }
      />
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

      {list && list.status === 'OPEN' ? (
        <CloseListSheet
          visible={closing}
          items={items}
          pricesOn={pricesOn}
          manualTotal={manualTotal}
          accounts={accounts.data ?? []}
          isClosing={closeList.isPending}
          onClose={() => setClosing(false)}
          onHighlightItem={setHighlightItemId}
          onConfirm={handleCloseConfirm}
        />
      ) : null}

      <RenameListSheet
        visible={renaming}
        currentName={list?.name ?? ''}
        isRenaming={renameList.isPending}
        onClose={() => setRenaming(false)}
        onConfirm={(name) => void handleRename(name)}
      />
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
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radii.listItem,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  addInput: {
    ...typography.body,
    flex: 1,
    minWidth: 0,
    paddingVertical: 8,
  },
  pendingCard: {
    borderRadius: radii.listItem,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    opacity: 0.6,
  },
  pendingName: {
    ...typography.bodyMedium,
  },
  totalValue: {
    ...typography.body,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    minWidth: 0,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  close: {
    marginTop: 16,
  },
  skeletonGroup: {
    gap: 12,
    padding: 14,
    borderRadius: radii.card,
  },
});
