import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';
import { ShoppingCart, WifiOff } from 'lucide-react-native';

import { getErrorMessage, isApiError } from '@/api/client';
import type { RecurringExpenseInput } from '@/api/recurringExpenses';
import {
  Banner,
  Button,
  EmptyState,
  ScreenContainer,
  Skeleton,
  TopBar,
  useToast,
} from '@/components/ui';
import { useAccounts } from '@/features/accounts/useAccounts';
import { useCreditCards } from '@/features/cards/useCreditCards';
import {
  DeferredExpenseForm,
  type DeferredExpenseFormPayload,
} from '@/features/deferred/DeferredExpenseForm';
import { useCreateDeferredExpense } from '@/features/deferred/useDeferredExpense';
import { ExpenseForm, type ExpenseFormPayload, type ExpenseKind } from '@/features/movements/ExpenseForm';
import { useExpenseDetail } from '@/features/movements/useMovementDetail';
import {
  useCreateExpense,
  useUpdateExpense,
} from '@/features/movements/useMovementMutations';
import { RecurringExpenseForm } from '@/features/recurring/RecurringExpenseForm';
import {
  useCreateRecurringExpense,
  useUpdateRecurringExpense,
} from '@/features/recurring/useRecurringMutations';
import { useRecurringExpense } from '@/features/recurring/useRecurringExpenses';
import { radii, useThemeColors } from '@/theme';

const EXPENSE_KINDS: ExpenseKind[] = ['instant', 'diferido', 'recurrente'];

function isExpenseKind(value: unknown): value is ExpenseKind {
  return typeof value === 'string' && EXPENSE_KINDS.includes(value as ExpenseKind);
}

export default function NewExpenseScreen() {
  const colors = useThemeColors();
  const toast = useToast();
  const params = useLocalSearchParams<{ id?: string; kind?: string; recurringId?: string }>();
  const id = params.id;
  const recurringId = params.recurringId;
  const editing = Boolean(id);

  const [kind, setKind] = useState<ExpenseKind>(() =>
    isExpenseKind(params.kind) ? params.kind : 'instant',
  );

  const accounts = useAccounts();
  const cards = useCreditCards();
  const expenseDetail = useExpenseDetail(id ?? '');
  const createExpense = useCreateExpense();
  const createDeferred = useCreateDeferredExpense();
  const updateExpense = useUpdateExpense(id ?? '');

  const recurringDetail = useRecurringExpense(recurringId ?? '');
  const createRecurring = useCreateRecurringExpense();
  const updateRecurring = useUpdateRecurringExpense(recurringId ?? '');

  if (editing && expenseDetail.isPending) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <TopBar title="Editar egreso" onBack={() => router.back()} />
        <ScreenContainer>
          <View style={styles.skeleton}>
            <Skeleton height={80} radius={radii.card} />
            <Skeleton height={220} radius={radii.card} />
          </View>
        </ScreenContainer>
      </View>
    );
  }

  if (editing && (expenseDetail.isError || !expenseDetail.data)) {
    const notFound = isApiError(expenseDetail.error) && expenseDetail.error.status === 404;

    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <TopBar title="Editar egreso" onBack={() => router.back()} />
        <ScreenContainer>
          {notFound ? (
            <EmptyState icon={ShoppingCart} title="Egreso no encontrado" />
          ) : (
            <>
              <Banner
                icon={WifiOff}
                title="Sin conexión"
                subtitle="No pudimos cargar el egreso"
                onPress={() => void expenseDetail.refetch()}
              />
              <Button
                title="Reintentar"
                variant="ghost"
                onPress={() => void expenseDetail.refetch()}
              />
            </>
          )}
        </ScreenContainer>
      </View>
    );
  }

  if (recurringId && recurringDetail.isPending) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <TopBar title="Editar recurrente" onBack={() => router.back()} />
        <ScreenContainer>
          <View style={styles.skeleton}>
            <Skeleton height={80} radius={radii.card} />
            <Skeleton height={220} radius={radii.card} />
          </View>
        </ScreenContainer>
      </View>
    );
  }

  if (recurringId && (recurringDetail.isError || !recurringDetail.data)) {
    const notFound = isApiError(recurringDetail.error) && recurringDetail.error.status === 404;

    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <TopBar title="Editar recurrente" onBack={() => router.back()} />
        <ScreenContainer>
          {notFound ? (
            <EmptyState icon={ShoppingCart} title="Recurrente no encontrado" />
          ) : (
            <>
              <Banner
                icon={WifiOff}
                title="Sin conexión"
                subtitle="No pudimos cargar la recurrencia"
                onPress={() => void recurringDetail.refetch()}
              />
              <Button
                title="Reintentar"
                variant="ghost"
                onPress={() => void recurringDetail.refetch()}
              />
            </>
          )}
        </ScreenContainer>
      </View>
    );
  }

  const handleSubmit = async (payload: ExpenseFormPayload) => {
    try {
      if (editing) {
        await updateExpense.mutateAsync({
          name: payload.name,
          accountId: payload.accountId,
          amount: payload.amount,
          description: payload.description,
          date: payload.date,
        });
        toast.show('Egreso actualizado');
      } else {
        await createExpense.mutateAsync({
          accountId: payload.accountId,
          name: payload.name,
          amount: payload.amount,
          description: payload.description,
          date: payload.date,
          paymentMethod: 'CORRIENTE',
        });
        toast.show('Egreso creado');
      }
      router.back();
    } catch (error) {
      toast.show(getErrorMessage(error, 'No se pudo guardar el egreso'));
    }
  };

  const handleDeferredSubmit = async (payload: DeferredExpenseFormPayload) => {
    try {
      await createDeferred.mutateAsync({
        accountId: payload.accountId,
        name: payload.name,
        amount: payload.amount,
        description: payload.description,
        date: payload.date,
        paymentMethod: 'DIFERIDO',
        creditCardId: payload.creditCardId,
        installments: payload.installments,
        graceMonths: payload.graceMonths,
      });
      toast.show('Compra diferida creada');
      router.back();
    } catch (error) {
      toast.show(getErrorMessage(error, 'No se pudo guardar la compra diferida'));
    }
  };

  const handleRecurringSubmit = async (input: RecurringExpenseInput) => {
    try {
      if (recurringId) {
        await updateRecurring.mutateAsync(input);
        toast.show('Recurrencia actualizada');
      } else {
        await createRecurring.mutateAsync(input);
        toast.show('Recurrencia creada');
      }
      router.back();
    } catch (error) {
      toast.show(getErrorMessage(error, 'No se pudo guardar la recurrencia'));
    }
  };

  if (recurringId && recurringDetail.data) {
    return (
      <RecurringExpenseForm
        title="Editar recurrente"
        accounts={accounts.data ?? []}
        config={recurringDetail.data}
        kind="recurrente"
        onKindChange={setKind}
        onBack={() => router.back()}
        onSubmit={handleRecurringSubmit}
      />
    );
  }

  if (!editing && kind === 'diferido') {
    return (
      <DeferredExpenseForm
        title="Egreso diferido"
        accounts={accounts.data ?? []}
        cards={cards.data ?? []}
        kind={kind}
        onKindChange={setKind}
        onBack={() => router.back()}
        onSubmit={handleDeferredSubmit}
      />
    );
  }

  if (!editing && kind === 'recurrente') {
    return (
      <RecurringExpenseForm
        title="Egreso recurrente"
        accounts={accounts.data ?? []}
        kind={kind}
        onKindChange={setKind}
        onBack={() => router.back()}
        onSubmit={handleRecurringSubmit}
      />
    );
  }

  return (
    <ExpenseForm
      title={editing ? 'Editar egreso' : 'Nuevo egreso'}
      expense={expenseDetail.data}
      accounts={accounts.data ?? []}
      kind={kind}
      onKindChange={setKind}
      onBack={() => router.back()}
      onSubmit={handleSubmit}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  skeleton: {
    gap: 16,
    marginTop: 12,
  },
});
