import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { toZonedTime } from 'date-fns-tz';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeftRight, WifiOff } from 'lucide-react-native';

import { getErrorMessage, isApiError } from '@/api/client';
import {
  Banner,
  Button,
  EmptyState,
  Group,
  IconTile,
  Row,
  ScreenContainer,
  Skeleton,
  TopBar,
  useConfirm,
  useToast,
} from '@/components/ui';
import { useAccounts } from '@/features/accounts/useAccounts';
import { useDeleteTransfer, useTransferDetail } from '@/features/transfers/useTransfers';
import { formatDate, formatMoney } from '@/lib/format';
import { detectTimezone } from '@/lib/timezone';
import { useAuthStore } from '@/stores/auth';
import { radii, typography, useThemeColors } from '@/theme';

function DetailSkeleton() {
  const colors = useThemeColors();

  return (
    <View>
      <Skeleton width={56} height={56} radius={18} style={styles.skeletonCenter} />
      <Skeleton width="45%" height={20} style={styles.skeletonCenter} />
      <Skeleton width="35%" height={34} style={styles.skeletonCenter} />
      <View style={[styles.skeletonGroup, { backgroundColor: colors.surface }]}>
        <Skeleton height={32} />
        <Skeleton height={32} />
        <Skeleton height={32} />
      </View>
    </View>
  );
}

export default function TransferDetailScreen() {
  const colors = useThemeColors();
  const toast = useToast();
  const confirm = useConfirm();
  const timezone = useAuthStore((state) => state.user?.timezone) ?? detectTimezone();
  const { id } = useLocalSearchParams<{ id: string }>();

  const detail = useTransferDetail(id ?? '');
  const accounts = useAccounts();
  const deleteTransfer = useDeleteTransfer(id ?? '');

  const transfer = detail.data;
  const accountName = (accountId: string): string =>
    accounts.data?.find((account) => account.id === accountId)?.name ?? '—';

  const isDeleting = deleteTransfer.isPending;
  const isNotFound = isApiError(detail.error) && detail.error.status === 404;

  const handleDelete = async () => {
    try {
      await deleteTransfer.mutateAsync();
      toast.show('Transferencia eliminada');
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/movements');
      }
    } catch (error) {
      toast.show(getErrorMessage(error, 'No se pudo eliminar la transferencia'));
    }
  };

  const confirmDelete = async () => {
    const confirmed = await confirm({
      title: 'Eliminar transferencia',
      message: 'Se eliminarán el egreso y el ingreso generados y los saldos volverán.',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      destructive: true,
    });
    if (confirmed) {
      await handleDelete();
    }
  };

  return (
    <>
      <TopBar title="Transferencia" onBack={() => router.back()} />
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
            icon={ArrowLeftRight}
            title="Transferencia no encontrada"
            message="Puede que se haya eliminado."
          />
        ) : detail.isError || !transfer ? (
          <>
            <Banner
              icon={WifiOff}
              title="Sin conexión"
              subtitle="No pudimos cargar la transferencia"
              onPress={() => void detail.refetch()}
            />
            <Button title="Reintentar" variant="ghost" onPress={() => void detail.refetch()} />
          </>
        ) : (
          <>
            <View style={styles.head}>
              <IconTile icon={ArrowLeftRight} size={56} iconSize={26} style={styles.headIcon} />
              <Text style={[styles.name, { color: colors.text }]}>Transferencia</Text>
              <Text style={[styles.amount, { color: colors.text }]}>
                {formatMoney(transfer.amount)}
              </Text>
              <Text style={[styles.date, { color: colors.muted }]}>
                {formatDate(toZonedTime(transfer.date, timezone), 'd MMM · HH:mm')}
              </Text>
            </View>

            {transfer.description ? (
              <View style={[styles.descriptionCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.descriptionLabel, { color: colors.muted }]}>Descripción</Text>
                <Text style={[styles.descriptionText, { color: colors.text }]}>
                  {transfer.description}
                </Text>
              </View>
            ) : null}

            <Group>
              <Row title="Cuenta origen" value={accountName(transfer.sourceAccountId)} />
              <Row title="Cuenta destino" value={accountName(transfer.destinationAccountId)} />
              <Row title="Fecha" value={formatDate(toZonedTime(transfer.date, timezone))} />
            </Group>

            <Group style={styles.deleteGroup}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Eliminar transferencia"
                disabled={isDeleting}
                onPress={() => void confirmDelete()}
              >
                <View style={[styles.deleteRow, isDeleting && { backgroundColor: colors.fill }]}>
                  <Text style={[styles.deleteText, { color: colors.negative }]}>
                    {isDeleting ? 'Eliminando…' : 'Eliminar transferencia'}
                  </Text>
                </View>
              </Pressable>
            </Group>
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
  descriptionCard: {
    borderRadius: radii.card,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
    marginBottom: 14,
  },
  descriptionLabel: {
    ...typography.caption,
    textTransform: 'uppercase',
  },
  descriptionText: {
    ...typography.body,
  },
  deleteGroup: {
    marginTop: 18,
  },
  deleteRow: {
    minHeight: 45,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  deleteText: {
    ...typography.body,
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
