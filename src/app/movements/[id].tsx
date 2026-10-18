import { Alert, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';
import { toZonedTime } from 'date-fns-tz';
import { ArrowUpDown, WifiOff } from 'lucide-react-native';

import { getErrorMessage, isApiError } from '@/api/client';
import type { Expense } from '@/api/expenses';
import type { Income } from '@/api/incomes';
import {
  Banner,
  Button,
  EmptyState,
  Group,
  IconTile,
  Note,
  Row,
  ScreenContainer,
  Skeleton,
  TextButton,
  TopBar,
  useToast,
} from '@/components/ui';
import { useAccounts } from '@/features/accounts/useAccounts';
import {
  expenseToMovement,
  incomeToMovement,
  movementIcon,
  type Movement,
  type MovementKind,
} from '@/features/movements/movements';
import { useMovementDetail } from '@/features/movements/useMovementDetail';
import {
  useDeleteExpense,
  useDeleteIncome,
} from '@/features/movements/useMovementMutations';
import { formatDate, formatMoney } from '@/lib/format';
import { detectTimezone } from '@/lib/timezone';
import { useAuthStore } from '@/stores/auth';
import { radii, typography, useThemeColors } from '@/theme';

function toMovement(kind: MovementKind, data: Income | Expense): Movement {
  return kind === 'income' ? incomeToMovement(data as Income) : expenseToMovement(data as Expense);
}

function DetailSkeleton() {
  const colors = useThemeColors();

  return (
    <View>
      <Skeleton width={56} height={56} radius={18} style={styles.skeletonIcon} />
      <Skeleton width="45%" height={20} style={styles.skeletonCenter} />
      <Skeleton width="35%" height={34} style={styles.skeletonCenter} />
      <View style={[styles.skeletonGroup, { backgroundColor: colors.surface }]}>
        <Skeleton height={32} />
        <Skeleton height={32} />
        <Skeleton height={32} />
        <Skeleton height={32} />
      </View>
    </View>
  );
}

export default function MovementDetailScreen() {
  const colors = useThemeColors();
  const toast = useToast();
  const timezone = useAuthStore((state) => state.user?.timezone) ?? detectTimezone();
  const params = useLocalSearchParams<{ id: string; kind?: string }>();
  const id = params.id;
  const kind: MovementKind = params.kind === 'income' ? 'income' : 'expense';

  const detail = useMovementDetail(kind, id);
  const accounts = useAccounts();
  const deleteIncome = useDeleteIncome(id);
  const deleteExpense = useDeleteExpense(id);

  const movement = detail.data ? toMovement(kind, detail.data) : undefined;
  const accountName =
    movement && accounts.data
      ? (accounts.data.find((account) => account.id === movement.accountId)?.name ?? '—')
      : '—';

  const isDeleting = kind === 'income' ? deleteIncome.isPending : deleteExpense.isPending;
  const isNotFound = isApiError(detail.error) && detail.error.status === 404;

  const handleDelete = async () => {
    try {
      if (kind === 'income') {
        await deleteIncome.mutateAsync();
      } else {
        await deleteExpense.mutateAsync();
      }
      toast.show('Movimiento eliminado');
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/movements');
      }
    } catch (error) {
      toast.show(getErrorMessage(error, 'No se pudo eliminar el movimiento'));
    }
  };

  const confirmDelete = () => {
    Alert.alert('Eliminar movimiento', 'El movimiento se eliminará de tus registros.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void handleDelete() },
    ]);
  };

  const edit = () => {
    if (kind === 'income') {
      router.push({ pathname: '/movements/income/new', params: { id } });
    } else {
      router.push({ pathname: '/movements/expense/new', params: { id } });
    }
  };

  return (
    <>
      <TopBar
        title="Detalle"
        onBack={() => router.back()}
        right={
          movement && movement.editability !== 'none' ? (
            <TextButton title="Editar" onPress={edit} />
          ) : undefined
        }
      />
      <ScreenContainer
        refreshControl={
          <RefreshControl
            refreshing={!detail.isPending && detail.isFetching}
            onRefresh={() => void detail.refetch()}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {detail.isPending ? (
          <DetailSkeleton />
        ) : isNotFound ? (
          <EmptyState
            icon={ArrowUpDown}
            title="Movimiento no encontrado"
            message="Puede que se haya eliminado."
          />
        ) : detail.isError || !movement ? (
          <>
            <Banner
              icon={WifiOff}
              title="Sin conexión"
              subtitle="No pudimos cargar el movimiento"
              onPress={() => void detail.refetch()}
            />
            <Button title="Reintentar" variant="ghost" onPress={() => void detail.refetch()} />
          </>
        ) : (
          <>
            <View style={styles.head}>
              <IconTile
                icon={movementIcon(movement)}
                size={56}
                iconSize={26}
                style={styles.headIcon}
              />
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
                {movement.name}
              </Text>
              <Text
                style={[
                  styles.amount,
                  { color: movement.kind === 'income' ? colors.positive : colors.text },
                ]}
              >
                {movement.kind === 'income' ? '+' : '−'}
                {formatMoney(movement.amount)}
              </Text>
              <Text style={[styles.date, { color: colors.muted }]}>
                {formatDate(toZonedTime(movement.date, timezone), 'd MMM · HH:mm')}
              </Text>
            </View>

            {movement.automatic ? (
              <Note style={styles.note}>
                <Text style={[styles.noteText, { color: colors.muted }]}>
                  Generado automáticamente desde{' '}
                  <Text style={[styles.noteStrong, { color: colors.text }]}>{movement.origin}</Text>. El
                  monto se gestiona desde su módulo de origen.
                </Text>
              </Note>
            ) : null}

            <Group>
              <Row title="Cuenta" value={accountName} />
              <Row title="Forma de pago" value={movement.paymentMethodLabel} />
              <Row title="Origen" value={movement.origin} />
              <Row title="Fecha" value={formatDate(toZonedTime(movement.date, timezone))} />
            </Group>

            {movement.deletable ? (
              <Group style={styles.deleteGroup}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Eliminar movimiento"
                  disabled={isDeleting}
                  onPress={confirmDelete}
                  style={({ pressed }) => [
                    styles.deleteRow,
                    (pressed || isDeleting) && { backgroundColor: colors.fill },
                  ]}
                >
                  <Text style={[styles.deleteText, { color: colors.negative }]}>
                    {isDeleting ? 'Eliminando…' : 'Eliminar movimiento'}
                  </Text>
                </Pressable>
              </Group>
            ) : null}
          </>
        )}
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  head: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 18,
  },
  headIcon: {
    borderRadius: 18,
    marginBottom: 10,
  },
  name: {
    ...typography.barTitle,
    textAlign: 'center',
  },
  amount: {
    ...typography.amountLarge,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  date: {
    ...typography.subhead,
    marginTop: 6,
  },
  note: {
    marginTop: 0,
    marginBottom: 14,
  },
  noteText: {
    ...typography.footnote,
    lineHeight: 18,
  },
  noteStrong: {
    fontWeight: '600',
  },
  deleteGroup: {
    marginTop: 18,
  },
  deleteRow: {
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  deleteText: {
    ...typography.body,
  },
  skeletonIcon: {
    alignSelf: 'center',
    marginTop: 12,
  },
  skeletonCenter: {
    alignSelf: 'center',
    marginTop: 12,
  },
  skeletonGroup: {
    gap: 12,
    padding: 14,
    borderRadius: radii.card,
    marginTop: 24,
  },
});
