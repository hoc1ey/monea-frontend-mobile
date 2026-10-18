import { StyleSheet, View } from 'react-native';

import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Landmark, WifiOff } from 'lucide-react-native';

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
import { ObligationForm } from '@/features/obligations/ObligationForm';
import {
  isObligationKind,
  OBLIGATION_KIND_CONFIG,
  type ObligationFormPayload,
} from '@/features/obligations/obligations';
import {
  useCreateObligation,
  useUpdateObligation,
} from '@/features/obligations/useObligationMutations';
import { useObligation } from '@/features/obligations/useObligations';
import { detectTimezone } from '@/lib/timezone';
import { useAuthStore } from '@/stores/auth';
import { radii, useThemeColors } from '@/theme';

/**
 * `/obligations/[tab]/new` — generic creation form (F11). When an `id` param is
 * present it edits the record instead (F12 for loans).
 */
export default function NewObligationScreen() {
  const colors = useThemeColors();
  const { tab, id } = useLocalSearchParams<{ tab: string; id?: string }>();
  const kind = isObligationKind(tab) ? tab : 'cobros';
  const editing = Boolean(id);

  const toast = useToast();
  const accounts = useAccounts();
  const timezone = useAuthStore((state) => state.user?.timezone) ?? detectTimezone();
  const detail = useObligation(kind, id ?? '');
  const createObligation = useCreateObligation(kind);
  const updateObligation = useUpdateObligation(kind, id ?? '');

  if (!isObligationKind(tab)) {
    return <Redirect href={{ pathname: '/obligations/[tab]', params: { tab: 'cobros' } }} />;
  }

  if (editing && detail.isPending) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <TopBar title="Editar registro" onBack={() => router.back()} />
        <ScreenContainer>
          <View style={styles.skeleton}>
            <Skeleton height={120} radius={radii.card} />
            <Skeleton height={120} radius={radii.card} />
          </View>
        </ScreenContainer>
      </View>
    );
  }

  if (editing && (detail.isError || !detail.data)) {
    const notFound = isApiError(detail.error) && detail.error.status === 404;

    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <TopBar title="Editar registro" onBack={() => router.back()} />
        <ScreenContainer>
          {notFound ? (
            <EmptyState icon={Landmark} title="Registro no encontrado" />
          ) : (
            <>
              <Banner
                icon={WifiOff}
                title="Sin conexión"
                subtitle="No pudimos cargar el registro"
                onPress={() => void detail.refetch()}
              />
              <Button title="Reintentar" variant="ghost" onPress={() => void detail.refetch()} />
            </>
          )}
        </ScreenContainer>
      </View>
    );
  }

  const config = OBLIGATION_KIND_CONFIG[kind];
  const paidCount =
    detail.data?.installments?.filter((installment) => installment.isPaid).length ?? 0;

  const handleSubmit = async (payload: ObligationFormPayload) => {
    try {
      if (editing && id) {
        await updateObligation.mutateAsync({
          personName: payload.personName,
          reminder: payload.reminder,
          ...(paidCount === 0 ? { installmentsCount: payload.installmentsCount } : {}),
          ...(config.hasDescription ? { description: payload.description ?? '' } : {}),
        });
        toast.show('Registro actualizado');
      } else {
        await createObligation.mutateAsync(payload);
        toast.show(config.createdToast);
      }

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace({ pathname: '/obligations/[tab]', params: { tab: kind } });
      }
    } catch (error) {
      toast.show(isApiError(error) ? error.message : 'No se pudo guardar el registro');
    }
  };

  return (
    <ObligationForm
      kind={kind}
      accounts={accounts.data ?? []}
      timezone={timezone}
      obligation={editing ? detail.data : undefined}
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
