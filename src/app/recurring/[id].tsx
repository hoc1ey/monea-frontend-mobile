import { useCallback, useRef } from 'react';
import { Alert, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { toZonedTime } from 'date-fns-tz';
import { Repeat, ShoppingCart, WifiOff } from 'lucide-react-native';

import { isApiError } from '@/api/client';
import type { Expense } from '@/api/expenses';
import type { RecurringExpenseConfig } from '@/api/recurringExpenses';
import {
  Banner,
  Button,
  EmptyState,
  Group,
  IconTile,
  Note,
  Row,
  ScreenContainer,
  SectionHeader,
  Skeleton,
  Switch,
  Tag,
  TextButton,
  TopBar,
  useToast,
} from '@/components/ui';
import { useAccounts } from '@/features/accounts/useAccounts';
import { recurringFrequencyLabel, recurringReminderLabel } from '@/features/recurring/recurring';
import {
  useRecurringExpense,
  useRecurringGeneratedExpenses,
} from '@/features/recurring/useRecurringExpenses';
import {
  useDeleteRecurringExpense,
  useSetRecurringActive,
} from '@/features/recurring/useRecurringMutations';
import { formatDate, formatMoney } from '@/lib/format';
import { detectTimezone } from '@/lib/timezone';
import { useAuthStore } from '@/stores/auth';
import { radii, typography, useThemeColors } from '@/theme';

function DetailSkeleton() {
  const colors = useThemeColors();

  return (
    <View>
      <Skeleton width="35%" height={14} style={styles.skeletonCenter} />
      <Skeleton width="45%" height={34} style={styles.skeletonCenter} />
      <Skeleton width="30%" height={14} style={styles.skeletonCenter} />
      <View style={[styles.skeletonGroup, { backgroundColor: colors.surface }]}>
        <Skeleton height={32} />
        <Skeleton height={32} />
        <Skeleton height={32} />
        <Skeleton height={32} />
      </View>
    </View>
  );
}

function amountLabel(config: RecurringExpenseConfig): string {
  return config.isVariableAmount ? 'Variable' : formatMoney(config.amount ?? 0);
}

export default function RecurringDetailScreen() {
  const colors = useThemeColors();
  const toast = useToast();
  const timezone = useAuthStore((state) => state.user?.timezone) ?? detectTimezone();
  const { id } = useLocalSearchParams<{ id: string }>();

  const detail = useRecurringExpense(id ?? '');
  const generated = useRecurringGeneratedExpenses(id ?? '');
  const accounts = useAccounts();
  const activeMutation = useSetRecurringActive();
  const deleteConfig = useDeleteRecurringExpense(id ?? '');

  const firstFocus = useRef(true);

  const config = detail.data;

  const refetch = detail.refetch;

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void refetch();
    }, [refetch]),
  );

  const accountName =
    config && accounts.data
      ? (accounts.data.find((account) => account.id === config.accountId)?.name ?? '—')
      : '—';

  const isNotFound = isApiError(detail.error) && detail.error.status === 404;

  const toggleActive = (value: boolean) => {
    activeMutation.mutate({ id: id ?? '', isActive: value });
  };

  const remove = async () => {
    try {
      await deleteConfig.mutateAsync();
      toast.show('Configuración eliminada');
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/recurring');
      }
    } catch (error) {
      toast.show(isApiError(error) ? error.message : 'No se pudo eliminar la configuración');
    }
  };

  const confirmRemove = () => {
    Alert.alert('Eliminar configuración', 'Los egresos ya generados se conservarán.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void remove() },
    ]);
  };

  const openExpense = (expense: Expense) => {
    if (expense.amountPending) {
      router.push('/recurring/define-amount');
      return;
    }
    router.push({ pathname: '/movements/[id]', params: { id: expense.id, kind: 'expense' } });
  };

  const edit = () => {
    if (!id) {
      return;
    }
    router.push({
      pathname: '/movements/expense/new',
      params: { kind: 'recurrente', recurringId: id },
    });
  };

  const generatedItems = generated.data ?? [];

  return (
    <>
      <TopBar
        title={config?.name ?? 'Recurrente'}
        onBack={() => router.back()}
        right={config ? <TextButton title="Editar" onPress={edit} /> : undefined}
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
          <EmptyState icon={Repeat} title="Recurrente no encontrado" message="Puede que se haya eliminado." />
        ) : detail.isError || !config ? (
          <>
            <Banner
              icon={WifiOff}
              title="Sin conexión"
              subtitle="No pudimos cargar la configuración"
              onPress={() => void detail.refetch()}
            />
            <Button title="Reintentar" variant="ghost" onPress={() => void detail.refetch()} />
          </>
        ) : (
          <>
            <View style={styles.head}>
              <Text style={[styles.frequency, { color: colors.muted }]}>
                {recurringFrequencyLabel[config.frequency]}
              </Text>
              <Text style={[styles.amount, { color: colors.text }]}>{amountLabel(config)}</Text>
              <Text style={[styles.footer, { color: colors.muted }]}>
                Próximo:{' '}
                {config.nextRunAt
                  ? formatDate(toZonedTime(config.nextRunAt, timezone), 'd MMM')
                  : '—'}
              </Text>
            </View>

            <SectionHeader title="Configuración" />
            <Group>
              <Row title="Cuenta" value={accountName} />
              <Row title="Recordatorio" value={recurringReminderLabel(config, timezone)} />
              <Row
                title="Estado"
                right={
                  <Tag
                    label={config.isActive ? 'Activo' : 'Inactivo'}
                    variant={config.isActive ? 'ok' : 'default'}
                  />
                }
              />
              <Row
                title="Activo"
                right={
                  <Switch
                    value={config.isActive}
                    onValueChange={toggleActive}
                    accessibilityLabel="Activo"
                  />
                }
              />
            </Group>

            <SectionHeader title="Egresos generados" />
            {generatedItems.length === 0 ? (
              <Group>
                <Row title="Aún no se han generado egresos" />
              </Group>
            ) : (
              <Group>
                {generatedItems.map((expense) => (
                  <Row
                    key={expense.id}
                    leading={
                      <IconTile icon={ShoppingCart} size={34} style={styles.expenseIcon} />
                    }
                    title="Egreso generado"
                    subtitle={
                      expense.occurrenceDate ? formatDate(expense.occurrenceDate, 'd MMM') : '—'
                    }
                    value={expense.amountPending ? undefined : formatMoney(expense.amount)}
                    right={expense.amountPending ? <Tag label="Definir monto" variant="acc" /> : undefined}
                    onPress={() => openExpense(expense)}
                  />
                ))}
              </Group>
            )}

            <Group style={styles.deleteGroup}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Eliminar configuración"
                disabled={deleteConfig.isPending}
                onPress={confirmRemove}
                style={({ pressed }) => [
                  styles.deleteRow,
                  (pressed || deleteConfig.isPending) && { backgroundColor: colors.fill },
                ]}
              >
                <Text style={[styles.deleteText, { color: colors.negative }]}>
                  {deleteConfig.isPending ? 'Eliminando…' : 'Eliminar configuración'}
                </Text>
              </Pressable>
            </Group>

            <Note style={styles.note}>
              Eliminar la configuración no borra los egresos ya generados.
            </Note>
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
  frequency: {
    ...typography.kicker,
  },
  amount: {
    ...typography.amountLarge,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  footer: {
    ...typography.kicker,
    marginTop: 6,
  },
  expenseIcon: {
    borderRadius: radii.icon,
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
  note: {
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
