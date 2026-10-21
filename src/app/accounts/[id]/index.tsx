import { useEffect } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';
import { ArrowDown, CreditCard, Repeat, ShoppingCart, Wallet, WifiOff } from 'lucide-react-native';

import { getErrorMessage } from '@/api/client';

import {
  Banner,
  Button,
  EmptyState,
  Group,
  HeroSm,
  Row,
  ScreenContainer,
  SectionHeader,
  Skeleton,
  Tag,
  TextButton,
  TopBar,
  useConfirm,
  useToast,
  type IconComponent,
} from '@/components/ui';
import { useAccountDetail, type AccountMovement } from '@/features/accounts/useAccountDetail';
import { useDeleteAccount } from '@/features/accounts/useAccountMutations';
import { formatMoney } from '@/lib/format';
import { radii, typography, useThemeColors } from '@/theme';

function movementIcon(movement: AccountMovement): IconComponent {
  if (movement.kind === 'income') {
    return ArrowDown;
  }
  if (movement.deferred || movement.sourceType === 'CARD_PAYMENT') {
    return CreditCard;
  }
  if (movement.sourceType === 'RECURRING') {
    return Repeat;
  }
  return ShoppingCart;
}

function MovementRow({ movement, accountName }: { movement: AccountMovement; accountName: string }) {
  const colors = useThemeColors();
  const icon = movementIcon(movement);

  if (movement.pending) {
    return (
      <Row
        icon={icon}
        title={movement.name}
        subtitle={`${accountName} · ${movement.origin}`}
        right={<Tag label="Definir monto" variant="acc" />}
      />
    );
  }

  const positive = movement.kind === 'income';

  return (
    <Row
      icon={icon}
      title={movement.name}
      subtitle={`${accountName} · ${movement.origin}`}
      right={
        <Text style={[styles.amount, { color: positive ? colors.positive : colors.text }]}>
          {positive ? '+' : '−'}
          {formatMoney(movement.amount)}
        </Text>
      }
    />
  );
}

function DetailSkeleton() {
  const colors = useThemeColors();

  return (
    <View>
      <Skeleton height={104} radius={radii.heroSm} style={styles.hero} />
      <Skeleton width="35%" height={14} style={styles.skeletonHeader} />
      <View style={[styles.skeletonGroup, { backgroundColor: colors.surface }]}>
        <Skeleton height={32} />
        <Skeleton height={32} />
      </View>
    </View>
  );
}

export default function AccountDetailScreen() {
  const colors = useThemeColors();
  const toast = useToast();
  const confirm = useConfirm();
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = useAccountDetail(id);
  const deleteAccount = useDeleteAccount(id);

  useEffect(() => {
    if (!detail.isNotFound) {
      return;
    }

    toast.show('Cuenta no encontrada');
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/accounts');
    }
  }, [detail.isNotFound, toast]);

  const refresh = () => {
    void detail.refetch();
  };

  const handleDelete = async () => {
    try {
      await deleteAccount.mutateAsync();
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/accounts');
      }
    } catch (error) {
      toast.show(getErrorMessage(error, 'No se pudo eliminar la cuenta'));
    }
  };

  const confirmDelete = async () => {
    const confirmed = await confirm({
      title: 'Eliminar cuenta',
      message: 'Se eliminará la cuenta. Tus movimientos se conservan.',
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (confirmed) {
      await handleDelete();
    }
  };

  const account = detail.account;

  return (
    <>
      <TopBar
        title={account?.name ?? 'Cuenta'}
        onBack={() => router.back()}
        right={
          account ? (
            <TextButton
              title="Editar"
              onPress={() =>
                router.push({ pathname: '/accounts/[id]/edit', params: { id: account.id } })
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
        {detail.isLoading ? (
          <DetailSkeleton />
        ) : detail.isNotFound ? (
          <EmptyState icon={Wallet} title="Cuenta no encontrada" />
        ) : detail.isError || !account ? (
          <>
            <Banner
              icon={WifiOff}
              title="Sin conexión"
              subtitle="No pudimos cargar la cuenta"
              onPress={refresh}
            />
            <Button title="Reintentar" variant="ghost" onPress={refresh} />
          </>
        ) : (
          <>
            <HeroSm
              label={account.financialInstitution}
              value={formatMoney(account.currentBalance)}
              gradient={[account.color, `${account.color}A6`]}
              style={styles.hero}
            />

            <SectionHeader title="Movimientos" />
            {detail.movements.length === 0 ? (
              <Group>
                <Row title="Sin movimientos" subtitle="Aún no hay registros en esta cuenta" />
              </Group>
            ) : (
              <Group>
                {detail.movements.map((movement) => (
                  <MovementRow
                    key={movement.id}
                    movement={movement}
                    accountName={account.name}
                  />
                ))}
              </Group>
            )}

            {account.description ? (
              <Text style={[styles.hint, { color: colors.muted }]}>{account.description}</Text>
            ) : null}

            <Button
              title="Eliminar cuenta"
              variant="danger"
              loading={deleteAccount.isPending}
              onPress={() => void confirmDelete()}
              style={styles.deleteButton}
            />
          </>
        )}
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: 12,
  },
  amount: {
    ...typography.body,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
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
