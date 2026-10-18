import { useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import { router } from 'expo-router';
import { Repeat, WifiOff } from 'lucide-react-native';

import { isApiError } from '@/api/client';
import {
  Banner,
  Button,
  EmptyState,
  Group,
  LargeHeader,
  Row,
  ScreenContainer,
  Skeleton,
  TopBar,
  useToast,
} from '@/components/ui';
import { useAccounts } from '@/features/accounts/useAccounts';
import { usePendingExpenses } from '@/features/movements/useMovements';
import { useSetExpenseAmount } from '@/features/movements/useMovementMutations';
import { formatDate } from '@/lib/format';
import { radii, useThemeColors } from '@/theme';

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

function AmountsSkeleton() {
  const colors = useThemeColors();

  return (
    <View style={[styles.skeletonGroup, { backgroundColor: colors.surface }]}>
      <Skeleton height={32} />
      <Skeleton height={32} />
    </View>
  );
}

export default function DefineAmountScreen() {
  const colors = useThemeColors();
  const toast = useToast();

  const pending = usePendingExpenses();
  const accounts = useAccounts();
  const setAmount = useSetExpenseAmount();

  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const accountNames = useMemo(
    () => new Map((accounts.data ?? []).map((account) => [account.id, account.name])),
    [accounts.data],
  );

  const items = pending.data ?? [];

  const setValue = (id: string, value: string) => {
    setValues((previous) => ({ ...previous, [id]: value }));
    setErrors((previous) => {
      if (!previous[id]) {
        return previous;
      }
      const next = { ...previous };
      delete next[id];
      return next;
    });
  };

  const save = async () => {
    const filled = Object.entries(values).filter(([, value]) => value.trim() !== '');

    if (filled.length === 0) {
      toast.show('Ingresa al menos un monto');
      return;
    }

    const nextErrors: Record<string, string> = {};
    const valid: [string, string][] = [];

    for (const [id, value] of filled) {
      const trimmed = value.trim();
      if (!AMOUNT_PATTERN.test(trimmed)) {
        nextErrors[id] = 'Monto inválido';
        continue;
      }
      valid.push([id, trimmed]);
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    const results = await Promise.allSettled(
      valid.map(([id, value]) => setAmount.mutateAsync({ id, amount: Number(value) })),
    );
    setSaving(false);

    const apiErrors: Record<string, string> = {};
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        apiErrors[valid[index][0]] = isApiError(result.reason)
          ? result.reason.message
          : 'No se pudo guardar';
      }
    });

    if (Object.keys(apiErrors).length > 0) {
      setErrors(apiErrors);
      toast.show('Algunos montos no se pudieron guardar');
      return;
    }

    toast.show('Monto guardado');
    setValues({});
  };

  const refresh = () => {
    void pending.refetch();
    void accounts.refetch();
  };

  const renderContent = () => {
    if (pending.isPending) {
      return <AmountsSkeleton />;
    }

    if (pending.isError) {
      return (
        <>
          <Banner
            icon={WifiOff}
            title="Sin conexión"
            subtitle="No pudimos cargar los montos pendientes"
            onPress={refresh}
          />
          <Button title="Reintentar" variant="ghost" onPress={refresh} />
        </>
      );
    }

    if (items.length === 0) {
      return <EmptyState icon={Repeat} title="No tienes montos pendientes" />;
    }

    return (
      <>
        <Group>
          {items.map((expense) => (
            <Row
              key={expense.id}
              icon={Repeat}
              title={expense.name}
              subtitle={`${accountNames.get(expense.accountId) ?? '—'} · ${formatDate(expense.date, 'd MMM')}`}
              right={
                <View style={styles.inputWrap}>
                  <TextInput
                    value={values[expense.id] ?? ''}
                    onChangeText={(value) => setValue(expense.id, value)}
                    placeholder="$0.00"
                    placeholderTextColor={colors.muted}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    accessibilityLabel={`Monto de ${expense.name}`}
                    style={[styles.input, { backgroundColor: colors.fill, color: colors.text }]}
                  />
                  {errors[expense.id] ? (
                    <Text style={[styles.rowError, { color: colors.negative }]}>
                      {errors[expense.id]}
                    </Text>
                  ) : null}
                </View>
              }
            />
          ))}
        </Group>
        <Button
          title="Guardar montos"
          loading={saving}
          onPress={() => void save()}
          style={styles.button}
        />
      </>
    );
  };

  return (
    <>
      <TopBar title="Definir monto" onBack={() => router.back()} />
      <ScreenContainer
        refreshControl={
          <RefreshControl
            refreshing={!pending.isPending && pending.isFetching}
            onRefresh={refresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <LargeHeader
          title="Montos pendientes"
          subtitle="Fija el monto solo de estas ocurrencias. La configuración no cambia."
        />
        {renderContent()}
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  input: {
    width: 100,
    borderRadius: radii.icon,
    paddingVertical: 7,
    paddingHorizontal: 8,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  rowError: {
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    marginTop: 16,
  },
  skeletonGroup: {
    gap: 12,
    padding: 14,
    borderRadius: radii.card,
    marginTop: 12,
  },
});
