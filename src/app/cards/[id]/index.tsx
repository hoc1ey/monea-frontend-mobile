import { useEffect, useState } from 'react';
import { Alert, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';
import { CreditCard, ShoppingCart, WifiOff } from 'lucide-react-native';

import { getErrorMessage, isApiError } from '@/api/client';
import {
  Banner,
  Button,
  Chips,
  CreditCardVisual,
  EmptyState,
  Group,
  Row,
  ScreenContainer,
  SectionHeader,
  Skeleton,
  Tag,
  TextButton,
  TopBar,
  useToast,
  type ChipOption,
  type TagVariant,
} from '@/components/ui';
import { useAccounts } from '@/features/accounts/useAccounts';
import { PayCardSheet } from '@/features/cards/PayCardSheet';
import {
  buildPeriods,
  currentPeriodInTimezone,
  isValidPeriod,
  shortMonthLabel,
} from '@/features/cards/periods';
import { useCreditCardDetail } from '@/features/cards/useCreditCardDetail';
import {
  useDeleteCreditCard,
  usePayCreditCard,
} from '@/features/cards/useCreditCardMutations';
import { formatMoney } from '@/lib/format';
import { detectTimezone } from '@/lib/timezone';
import { useAuthStore } from '@/stores/auth';
import { radii, typography, useThemeColors } from '@/theme';

function DetailSkeleton() {
  const colors = useThemeColors();

  return (
    <View>
      <Skeleton height={172} radius={radii.creditCard} style={styles.visual} />
      <View style={[styles.skeletonGroup, { backgroundColor: colors.surface }]}>
        <Skeleton height={32} />
        <Skeleton height={32} />
      </View>
      <Skeleton width="35%" height={14} style={styles.skeletonHeader} />
      <Skeleton height={140} radius={radii.card} />
    </View>
  );
}

function periodTag(total: number, paid: boolean): { label: string; variant: TagVariant } {
  if (paid) {
    return { label: 'Pagado', variant: 'ok' };
  }
  if (total > 0) {
    return { label: 'Pendiente', variant: 'acc' };
  }
  return { label: 'Sin cargos', variant: 'default' };
}

export default function CardDetailScreen() {
  const colors = useThemeColors();
  const toast = useToast();
  const params = useLocalSearchParams<{ id: string; period?: string }>();
  const id = params.id;
  const timezone = useAuthStore((state) => state.user?.timezone) ?? detectTimezone();

  const [period, setPeriod] = useState(() =>
    isValidPeriod(params.period) ? params.period : currentPeriodInTimezone(timezone),
  );
  const [payVisible, setPayVisible] = useState(false);

  const detail = useCreditCardDetail(id, period);
  const accounts = useAccounts();
  const deleteCard = useDeleteCreditCard(id);
  const pay = usePayCreditCard(id);

  useEffect(() => {
    if (!detail.isNotFound) {
      return;
    }

    toast.show('Tarjeta no encontrada');
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({ pathname: '/accounts', params: { tab: 'cards' } });
    }
  }, [detail.isNotFound, toast]);

  const refresh = () => {
    void detail.refetch();
  };

  const card = detail.card;
  const debt = detail.debt;
  const report = detail.report;

  const handleDelete = async () => {
    try {
      await deleteCard.mutateAsync();
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace({ pathname: '/accounts', params: { tab: 'cards' } });
      }
    } catch (error) {
      toast.show(getErrorMessage(error, 'No se pudo eliminar la tarjeta'));
    }
  };

  const confirmDelete = () => {
    Alert.alert('Eliminar tarjeta', 'Se eliminará la tarjeta. Los egresos diferidos se conservan.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void handleDelete() },
    ]);
  };

  const handleConfirmPay = async (accountId: string) => {
    try {
      await pay.mutateAsync({ accountId, period });
      setPayVisible(false);
      toast.show('Pago registrado · egreso creado');
    } catch (error) {
      if (isApiError(error) && error.status === 409) {
        setPayVisible(false);
        toast.show('Este periodo ya fue pagado');
        return;
      }
      toast.show(getErrorMessage(error, 'No se pudo registrar el pago'));
    }
  };

  const periodOptions: ChipOption<string>[] = buildPeriods(
    currentPeriodInTimezone(timezone),
  ).map((value) => ({ value, label: shortMonthLabel(value) }));

  const tag = report ? periodTag(report.total, report.paid) : null;

  return (
    <>
      <TopBar
        title={card?.name ?? 'Tarjeta'}
        onBack={() => router.back()}
        right={
          card ? (
            <TextButton
              title="Editar"
              onPress={() =>
                router.push({ pathname: '/cards/[id]/edit', params: { id: card.id } })
              }
            />
          ) : undefined
        }
      />
      <ScreenContainer
        refreshControl={
          <RefreshControl
            refreshing={detail.isRefreshing}
            onRefresh={refresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {detail.isLoading && !card ? (
          <DetailSkeleton />
        ) : detail.isNotFound ? (
          <EmptyState icon={CreditCard} title="Tarjeta no encontrada" />
        ) : detail.isError || !card ? (
          <>
            <Banner
              icon={WifiOff}
              title="Sin conexión"
              subtitle="No pudimos cargar la tarjeta"
              onPress={refresh}
            />
            <Button title="Reintentar" variant="ghost" onPress={refresh} />
          </>
        ) : (
          <>
            <CreditCardVisual
              name={card.name}
              issuer={card.issuer}
              last4={card.lastFourDigits}
              color={card.color}
              debt={report?.total ?? debt?.currentDebt}
              style={styles.visual}
            />

            {debt ? (
              <Group>
                <Row title="Cupo disponible" value={formatMoney(debt.availableCredit)} />
                <Row title="Cupo total" value={formatMoney(debt.creditLimit)} />
                <Row
                  title="Fecha de corte"
                  value={card.cutoffDay != null ? `día ${card.cutoffDay}` : '—'}
                />
                <Row
                  title="Fecha de pago"
                  value={card.paymentDay != null ? `día ${card.paymentDay}` : '—'}
                />
              </Group>
            ) : (
              <View style={[styles.skeletonGroup, { backgroundColor: colors.surface }]}>
                <Skeleton height={32} />
                <Skeleton height={32} />
              </View>
            )}

            <SectionHeader title="Periodo" />
            <Chips options={periodOptions} value={period} onChange={setPeriod} />

            {!report || !tag ? (
              <Skeleton height={140} radius={radii.card} />
            ) : (
              <View style={[styles.periodCard, { backgroundColor: colors.surface }]}>
                <View style={styles.periodTop}>
                  <View style={styles.periodLeft}>
                    <Text style={[styles.periodLabel, { color: colors.muted }]}>
                      Total del periodo
                    </Text>
                    <Text style={[styles.periodAmount, { color: colors.text }]}>
                      {formatMoney(report.total)}
                    </Text>
                  </View>
                  <Tag label={tag.label} variant={tag.variant} />
                </View>
                <Text style={[styles.periodFooter, { color: colors.muted }]}>
                  Corte {report.cutoffDate} · Pago {report.paymentDate}
                </Text>
                {report.total > 0 && !report.paid ? (
                  <Button
                    title="Pagar periodo"
                    small
                    onPress={() => setPayVisible(true)}
                    style={styles.payButton}
                  />
                ) : null}
              </View>
            )}

            <SectionHeader title="Compras del periodo" />
            {!report ? (
              <Skeleton height={96} radius={radii.card} />
            ) : report.items.length === 0 ? (
              <Group>
                <Row title="Sin cargos en este periodo" />
              </Group>
            ) : (
              <Group>
                {report.items.map((item, index) => (
                  <Row
                    key={`${item.name}-${item.installmentNumber}-${index}`}
                    icon={ShoppingCart}
                    title={item.name}
                    subtitle={`Cuota ${item.installmentNumber} de ${item.installmentsTotal}`}
                    value={formatMoney(item.amount)}
                  />
                ))}
              </Group>
            )}

            <Button
              title="Eliminar tarjeta"
              variant="danger"
              loading={deleteCard.isPending}
              onPress={confirmDelete}
              style={styles.deleteButton}
            />

            <PayCardSheet
              visible={payVisible}
              onClose={() => setPayVisible(false)}
              card={card}
              period={period}
              total={report?.total ?? 0}
              accounts={accounts.data ?? []}
              isPaying={pay.isPending}
              onConfirm={(accountId) => void handleConfirmPay(accountId)}
            />
          </>
        )}
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  visual: {
    marginTop: 12,
  },
  periodCard: {
    borderRadius: radii.card,
    padding: 16,
  },
  periodTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  periodLeft: {
    flex: 1,
    minWidth: 0,
  },
  periodLabel: {
    ...typography.footnote,
  },
  periodAmount: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.6,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  periodFooter: {
    ...typography.footnote,
    marginTop: 10,
  },
  payButton: {
    width: '100%',
    marginTop: 14,
  },
  deleteButton: {
    marginTop: 18,
  },
  skeletonGroup: {
    gap: 12,
    padding: 14,
    marginTop: 12,
    borderRadius: radii.card,
  },
  skeletonHeader: {
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 14,
  },
});
