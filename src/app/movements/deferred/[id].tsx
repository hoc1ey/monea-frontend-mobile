import { useCallback, useRef } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { CreditCard, WifiOff } from 'lucide-react-native';

import { isApiError } from '@/api/client';
import type { ExpenseInstallment } from '@/api/expenses';
import {
  Banner,
  Button,
  EmptyState,
  Group,
  Note,
  ProgressBar,
  Row,
  ScreenContainer,
  SectionHeader,
  Skeleton,
  Tag,
  TopBar,
} from '@/components/ui';
import { useCreditCards } from '@/features/cards/useCreditCards';
import { useExpenseDetail } from '@/features/movements/useMovementDetail';
import { formatMoney, formatPeriod } from '@/lib/format';
import { radii, typography, useThemeColors } from '@/theme';

/** Neutral tile that shows the installment number (prototype `.ico neutral`). */
function InstallmentTile({ number }: { number: number }) {
  const colors = useThemeColors();

  return (
    <View style={[styles.tile, { backgroundColor: colors.fill }]}>
      <Text style={[styles.tileText, { color: colors.text }]}>{number}</Text>
    </View>
  );
}

function DetailSkeleton() {
  const colors = useThemeColors();

  return (
    <View>
      <Skeleton width="45%" height={20} style={styles.skeletonCenter} />
      <Skeleton width="35%" height={34} style={styles.skeletonCenter} />
      <View style={[styles.skeletonCard, { backgroundColor: colors.surface }]}>
        <Skeleton height={20} />
        <Skeleton height={6} radius={3} />
      </View>
      <Skeleton width="35%" height={14} style={styles.skeletonHeader} />
      <View style={[styles.skeletonGroup, { backgroundColor: colors.surface }]}>
        <Skeleton height={32} />
        <Skeleton height={32} />
        <Skeleton height={32} />
      </View>
    </View>
  );
}

function progressCount(plan: ExpenseInstallment[]): { paid: number; total: number } {
  const paid = plan.filter((installment) => installment.isPaid).length;
  return { paid, total: plan.length };
}

export default function DeferredDetailScreen() {
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();

  const detail = useExpenseDetail(id ?? '');
  const cards = useCreditCards();
  const refetch = detail.refetch;

  const firstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void refetch();
    }, [refetch]),
  );

  const expense = detail.data;
  const card = expense?.creditCardId
    ? cards.data?.find((item) => item.id === expense.creditCardId)
    : undefined;
  const plan = expense?.installmentPlan ?? [];
  const { paid, total } = progressCount(plan);
  const isNotFound = isApiError(detail.error) && detail.error.status === 404;

  return (
    <>
      <TopBar title="Compra diferida" onBack={() => router.back()} />
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
            icon={CreditCard}
            title="Compra diferida no encontrada"
            message="Puede que se haya eliminado."
          />
        ) : detail.isError || !expense ? (
          <>
            <Banner
              icon={WifiOff}
              title="Sin conexión"
              subtitle="No pudimos cargar la compra diferida"
              onPress={() => void detail.refetch()}
            />
            <Button title="Reintentar" variant="ghost" onPress={() => void detail.refetch()} />
          </>
        ) : (
          <>
            <View style={styles.head}>
              <Text style={[styles.name, { color: colors.muted }]} numberOfLines={2}>
                {expense.name}
              </Text>
              <Text style={[styles.amount, { color: colors.text }]}>
                {formatMoney(expense.amount)}
              </Text>
              <Text style={[styles.footer, { color: colors.muted }]}>
                {card?.name ?? '—'} · {expense.installments ?? total} cuotas
              </Text>
            </View>

            {expense.description ? (
              <View style={[styles.descriptionCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.descriptionLabel, { color: colors.muted }]}>Descripción</Text>
                <Text style={[styles.descriptionText, { color: colors.text }]}>
                  {expense.description}
                </Text>
              </View>
            ) : null}

            <View style={[styles.progressCard, { backgroundColor: colors.surface }]}>
              <View style={styles.progressTop}>
                <Text style={[styles.progressLabel, { color: colors.text }]}>Cuotas pagadas</Text>
                <Text style={[styles.progressValue, { color: colors.text }]}>
                  {paid} de {total}
                </Text>
              </View>
              <ProgressBar progress={total > 0 ? paid / total : 0} style={styles.progressBar} />
            </View>

            <SectionHeader title="Plan de cuotas" />
            {plan.length === 0 ? (
              <Group>
                <Row title="Sin cuotas registradas" />
              </Group>
            ) : (
              <Group>
                {plan.map((installment) => (
                  <Row
                    key={installment.id}
                    leading={<InstallmentTile number={installment.number} />}
                    title={formatMoney(installment.amount)}
                    subtitle={formatPeriod(installment.period)}
                    right={
                      <Tag
                        label={installment.isPaid ? 'Pagada' : 'Pendiente'}
                        variant={installment.isPaid ? 'ok' : 'default'}
                      />
                    }
                  />
                ))}
              </Group>
            )}

            <Note style={styles.note}>
              Las cuotas no descuentan del saldo de la cuenta hasta pagar el periodo de la tarjeta.
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
  name: {
    ...typography.body,
    textAlign: 'center',
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
  progressCard: {
    borderRadius: radii.card,
    padding: 16,
  },
  progressTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  progressLabel: {
    ...typography.kicker,
  },
  progressValue: {
    ...typography.kicker,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  progressBar: {
    marginTop: 12,
  },
  note: {
    marginTop: 12,
  },
  tile: {
    width: 34,
    height: 34,
    borderRadius: radii.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  skeletonCenter: {
    alignSelf: 'center',
    marginTop: 12,
  },
  skeletonCard: {
    gap: 12,
    padding: 16,
    borderRadius: radii.card,
    marginTop: 18,
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
