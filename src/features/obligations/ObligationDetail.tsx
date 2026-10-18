import { useState } from 'react';
import { Alert, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';
import { ArrowDown, ArrowUp, Landmark, WifiOff } from 'lucide-react-native';

import { isApiError } from '@/api/client';
import type { ObligationInstallment } from '@/api/obligations';
import {
  Avatar,
  Banner,
  Button,
  EmptyState,
  Group,
  ProgressBar,
  ScreenContainer,
  SectionHeader,
  Skeleton,
  TopBar,
  useToast,
  type IconComponent,
} from '@/components/ui';
import { useAccounts } from '@/features/accounts/useAccounts';
import { formatMoney } from '@/lib/format';
import { detectTimezone } from '@/lib/timezone';
import { useAuthStore } from '@/stores/auth';
import { radii, typography, useThemeColors } from '@/theme';

import { InstallmentRow } from './InstallmentRow';
import {
  OBLIGATION_KIND_CONFIG,
  toObligationView,
  type ObligationKind,
  type ObligationView,
} from './obligations';
import { PayInstallmentSheet } from './PayInstallmentSheet';
import { useObligation } from './useObligations';
import { useDeleteObligation, usePayInstallment } from './useObligationMutations';

const KIND_ICON: Record<ObligationKind, IconComponent> = {
  cobros: ArrowDown,
  prestamos: Landmark,
  deudas: ArrowUp,
};

function SummaryRow({ label, value, tone }: { label: string; value: string; tone?: 'positive' }) {
  const colors = useThemeColors();

  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: tone === 'positive' ? colors.positive : colors.text }]}>
        {value}
      </Text>
    </View>
  );
}

function SummaryCard({ view }: { view: ObligationView }) {
  const colors = useThemeColors();
  const progress = view.totalAmount > 0 ? view.paidAmount / view.totalAmount : 0;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <SummaryRow label="Total" value={formatMoney(view.totalAmount)} />
      <SummaryRow label="Pagado" value={formatMoney(view.paidAmount)} tone="positive" />
      <SummaryRow label="Pendiente" value={formatMoney(view.pendingAmount)} />
      <ProgressBar progress={progress} style={styles.progress} />
    </View>
  );
}

function DetailSkeleton() {
  const colors = useThemeColors();

  return (
    <View>
      <View style={styles.skeletonHeader}>
        <Skeleton width={64} height={64} radius={32} />
        <Skeleton width="45%" height={18} />
        <Skeleton width="65%" height={14} />
      </View>
      <View style={[styles.skeletonGroup, { backgroundColor: colors.surface }]}>
        <Skeleton height={32} />
        <Skeleton height={32} />
        <Skeleton height={32} />
      </View>
    </View>
  );
}

export interface ObligationDetailProps {
  kind: ObligationKind;
  id: string;
}

/**
 * Obligation detail: person header, totals with progress, installments and the
 * "Marcar cuota como pagada" sheet, plus the delete action.
 */
export function ObligationDetail({ kind, id }: ObligationDetailProps) {
  const colors = useThemeColors();
  const toast = useToast();
  const config = OBLIGATION_KIND_CONFIG[kind];
  const timezone = useAuthStore((state) => state.user?.timezone) ?? detectTimezone();

  const query = useObligation(kind, id);
  const accounts = useAccounts();
  const deleteObligation = useDeleteObligation(kind, id);
  const payInstallment = usePayInstallment(kind, id);

  const [target, setTarget] = useState<ObligationInstallment | null>(null);

  const view = query.data ? toObligationView(query.data) : null;
  const isNotFound = isApiError(query.error) && query.error.status === 404;

  const backOrFallback = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({ pathname: '/obligations/[tab]', params: { tab: kind } });
    }
  };

  const sourceAccountName =
    view?.accountId != null
      ? accounts.data?.find((account) => account.id === view.accountId)?.name
      : undefined;

  const handleConfirmPay = async (accountId: string) => {
    if (!target) {
      return;
    }

    try {
      await payInstallment.mutateAsync({ installmentId: target.id, input: { accountId } });
      setTarget(null);
      toast.show('Cuota marcada como pagada');
    } catch (error) {
      if (isApiError(error) && error.status === 400) {
        setTarget(null);
        toast.show('Esta cuota ya está pagada');
        return;
      }
      toast.show(isApiError(error) ? error.message : 'No se pudo marcar la cuota');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteObligation.mutateAsync();
      toast.show('Registro eliminado');
      backOrFallback();
    } catch (error) {
      toast.show(isApiError(error) ? error.message : 'No se pudo eliminar el registro');
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Eliminar registro',
      'Se eliminará el registro. Los movimientos ya generados se conservan.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => void handleDelete() },
      ],
    );
  };

  const renderContent = () => {
    if (query.isPending) {
      return <DetailSkeleton />;
    }

    if (isNotFound) {
      return (
        <EmptyState
          icon={KIND_ICON[kind]}
          title={`${config.singular} no encontrado`}
          message="El registro que buscas no existe o fue eliminado."
        />
      );
    }

    if (query.isError || !view) {
      return (
        <>
          <Banner
            icon={WifiOff}
            title="Sin conexión"
            subtitle="No pudimos cargar el registro"
            onPress={() => void query.refetch()}
          />
          <Button title="Reintentar" variant="ghost" onPress={() => void query.refetch()} />
        </>
      );
    }

    return (
      <>
        <View style={styles.header}>
          <Avatar name={view.personName} size={64} />
          <Text style={[styles.name, { color: colors.text }]}>{view.personName}</Text>
          <Text style={[styles.description, { color: colors.muted }]}>
            {view.description ?? 'Sin descripción'}
          </Text>
        </View>

        <SummaryCard view={view} />

        {sourceAccountName ? (
          <Text style={[styles.hint, { color: colors.muted }]}>
            Cuenta de salida: {sourceAccountName}
          </Text>
        ) : null}

        <SectionHeader title="Cuotas" />
        <Group>
          {view.installments.map((installment) => (
            <InstallmentRow
              key={installment.id}
              installment={installment}
              timezone={timezone}
              paying={payInstallment.isPending && payInstallment.variables?.installmentId === installment.id}
              onPay={setTarget}
            />
          ))}
        </Group>

        <Button
          title="Eliminar registro"
          variant="danger"
          loading={deleteObligation.isPending}
          onPress={confirmDelete}
          style={styles.deleteButton}
        />
      </>
    );
  };

  return (
    <>
      <TopBar
        title={view ? `${config.singular} · ${view.personName}` : config.singular}
        onBack={backOrFallback}
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

      <PayInstallmentSheet
        visible={target !== null}
        personName={view?.personName ?? ''}
        amount={target?.amount ?? 0}
        accounts={accounts.data ?? []}
        isPaying={payInstallment.isPending}
        onClose={() => setTarget(null)}
        onConfirm={(accountId) => void handleConfirmPay(accountId)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    paddingBottom: 18,
  },
  name: {
    ...typography.barTitle,
  },
  description: {
    ...typography.body,
    textAlign: 'center',
  },
  card: {
    borderRadius: radii.card,
    padding: 16,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    ...typography.kicker,
  },
  summaryValue: {
    ...typography.kicker,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  progress: {
    marginTop: 4,
  },
  hint: {
    ...typography.footnote,
    textAlign: 'center',
    marginTop: 14,
  },
  deleteButton: {
    marginTop: 18,
  },
  skeletonHeader: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  skeletonGroup: {
    gap: 12,
    padding: 14,
    borderRadius: radii.card,
  },
});
