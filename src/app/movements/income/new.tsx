import { StyleSheet, View } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';
import { ArrowUpDown, WifiOff } from 'lucide-react-native';

import { isApiError } from '@/api/client';
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
import { IncomeForm, type IncomeFormPayload } from '@/features/movements/IncomeForm';
import { useIncomeDetail } from '@/features/movements/useMovementDetail';
import {
  useCreateIncome,
  useUpdateIncome,
} from '@/features/movements/useMovementMutations';
import { radii, useThemeColors } from '@/theme';

export default function NewIncomeScreen() {
  const colors = useThemeColors();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = Boolean(id);

  const accounts = useAccounts();
  const incomeDetail = useIncomeDetail(id ?? '');
  const createIncome = useCreateIncome();
  const updateIncome = useUpdateIncome(id ?? '');

  if (editing && incomeDetail.isPending) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <TopBar title="Editar ingreso" onBack={() => router.back()} />
        <ScreenContainer>
          <View style={styles.skeleton}>
            <Skeleton height={80} radius={radii.card} />
            <Skeleton height={220} radius={radii.card} />
          </View>
        </ScreenContainer>
      </View>
    );
  }

  if (editing && (incomeDetail.isError || !incomeDetail.data)) {
    const notFound = isApiError(incomeDetail.error) && incomeDetail.error.status === 404;

    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <TopBar title="Editar ingreso" onBack={() => router.back()} />
        <ScreenContainer>
          {notFound ? (
            <EmptyState icon={ArrowUpDown} title="Ingreso no encontrado" />
          ) : (
            <>
              <Banner
                icon={WifiOff}
                title="Sin conexión"
                subtitle="No pudimos cargar el ingreso"
                onPress={() => void incomeDetail.refetch()}
              />
              <Button
                title="Reintentar"
                variant="ghost"
                onPress={() => void incomeDetail.refetch()}
              />
            </>
          )}
        </ScreenContainer>
      </View>
    );
  }

  const handleSubmit = async (payload: IncomeFormPayload) => {
    try {
      if (editing) {
        await updateIncome.mutateAsync({
          name: payload.name,
          description: payload.description,
          ...(payload.accountId ? { accountId: payload.accountId } : {}),
          ...(payload.amount != null ? { amount: payload.amount } : {}),
          ...(payload.date ? { date: payload.date } : {}),
        });
        toast.show('Ingreso actualizado');
      } else {
        await createIncome.mutateAsync({
          accountId: payload.accountId ?? '',
          name: payload.name,
          amount: payload.amount ?? 0,
          description: payload.description,
          date: payload.date,
        });
        toast.show('Ingreso creado');
      }
      router.back();
    } catch (error) {
      toast.show(isApiError(error) ? error.message : 'No se pudo guardar el ingreso');
    }
  };

  return (
    <IncomeForm
      title={editing ? 'Editar ingreso' : 'Nuevo ingreso'}
      income={incomeDetail.data}
      accounts={accounts.data ?? []}
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
