import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';
import { Bell, CreditCard, Repeat, Wallet, WifiOff } from 'lucide-react-native';

import { Fab } from '@/components/navigation/Fab';
import {
  Banner,
  Button,
  EmptyState,
  Group,
  Hero,
  LargeHeader,
  MiniAccountCard,
  Row,
  ScreenContainer,
  SectionHeader,
  Skeleton,
  Tag,
} from '@/components/ui';
import {
  useHomeDashboard,
  type HomeAttention,
  type HomeCard,
} from '@/features/home/useHomeDashboard';
import { movementIcon, type Movement } from '@/features/movements/movements';
import { formatDate, formatMoney } from '@/lib/format';
import { useUiStore } from '@/stores/ui';
import { ICON_STROKE, radii, typography, useThemeColors } from '@/theme';

function todayLabel(): string {
  const label = formatDate(new Date(), "EEEE, d 'de' MMMM");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** 36 dp circular `fill` icon-button (prototype `.ib`), used for the bell. */
function BellButton({ onPress }: { onPress: () => void }) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Recordatorios"
      onPress={onPress}
      style={({ pressed }) => [
        styles.bell,
        { backgroundColor: colors.fill },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Bell size={20} color={colors.accentInk} strokeWidth={ICON_STROKE} />
    </Pressable>
  );
}

function HomeSkeleton() {
  return (
    <View>
      <Skeleton height={144} radius={radii.hero} />
      <Skeleton width="35%" height={14} style={styles.skeletonHeader} />
      <View style={styles.skeletonGroup}>
        <Skeleton height={32} />
        <Skeleton height={32} />
        <Skeleton height={32} />
      </View>
    </View>
  );
}

/** Right-aligned section link (prototype `.lnk`). */
function SectionLink({ label, onPress }: { label: string; onPress: () => void }) {
  const colors = useThemeColors();

  return (
    <Pressable accessibilityRole="link" accessibilityLabel={label} onPress={onPress}>
      <Text style={[styles.link, { color: colors.accentInk }]}>{label}</Text>
    </Pressable>
  );
}

/** Card icon on a tile tinted with the card color at 20 % (prototype `${color}33`). */
function CardTile({ color }: { color: string }) {
  return (
    <View style={[styles.cardTile, { backgroundColor: `${color}33` }]}>
      <CreditCard size={18} color={color} strokeWidth={ICON_STROKE} />
    </View>
  );
}

function AttentionRows({ items }: { items: HomeAttention[] }) {
  return (
    <Group>
      {items.map((item) => {
        if (item.kind === 'card-payment') {
          return (
            <Row
              key={item.id}
              icon={Bell}
              title={item.title}
              subtitle={item.subtitle}
              onPress={() =>
                router.push({ pathname: '/cards/[id]', params: { id: item.cardId } })
              }
            />
          );
        }

        return (
          <Row
            key={item.id}
            icon={Repeat}
            title={`${item.name} · define el monto`}
            subtitle="Egreso de cantidad variable"
            onPress={() => router.push('/recurring/define-amount')}
          />
        );
      })}
    </Group>
  );
}

function CardsGroup({ cards }: { cards: HomeCard[] }) {
  return (
    <Group>
      {cards.map((card) => (
        <Row
          key={card.id}
          leading={<CardTile color={card.color} />}
          title={card.name}
          subtitle={card.paymentDay != null ? `Pago el ${card.paymentDay} de cada mes` : undefined}
          value={formatMoney(card.periodDebt)}
          onPress={() => router.push({ pathname: '/cards/[id]', params: { id: card.id } })}
        />
      ))}
    </Group>
  );
}

function WeekRows({
  items,
  accountNames,
}: {
  items: Movement[];
  accountNames: Map<string, string>;
}) {
  const colors = useThemeColors();

  return (
    <Group>
      {items.map((movement) => {
        const income = movement.kind === 'income';

        const open = () => {
          if (movement.pending) {
            router.push('/recurring/define-amount');
            return;
          }
          if (movement.deferred) {
            router.push({ pathname: '/movements/deferred/[id]', params: { id: movement.id } });
            return;
          }
          router.push({
            pathname: '/movements/[id]',
            params: { id: movement.id, kind: movement.kind },
          });
        };

        return (
          <Row
            key={movement.id}
            icon={movementIcon(movement)}
            title={movement.name}
            subtitle={`${accountNames.get(movement.accountId) ?? '—'} · ${movement.origin}`}
            onPress={open}
            right={
              movement.pending ? (
                <Tag label="Definir monto" variant="acc" />
              ) : (
                <Text
                  style={[
                    styles.weekAmount,
                    { color: income ? colors.positive : colors.negative },
                  ]}
                >
                  {income ? '+' : '−'}
                  {formatMoney(movement.amount)}
                </Text>
              )
            }
          />
        );
      })}
    </Group>
  );
}

export default function HomeScreen() {
  const colors = useThemeColors();
  const openQuickActions = useUiStore((state) => state.openQuickActions);
  const dashboard = useHomeDashboard();

  const accountNames = useMemo(
    () => new Map(dashboard.accounts.map((account) => [account.id, account.name])),
    [dashboard.accounts],
  );

  const hasAccounts = dashboard.accounts.length > 0;
  const showEmpty = !dashboard.isError && !hasAccounts;

  const refresh = () => {
    void dashboard.refetch();
  };

  return (
    <View style={styles.flex}>
      <ScreenContainer
        refreshControl={
          <RefreshControl
            refreshing={dashboard.isRefreshing}
            onRefresh={refresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <LargeHeader
          kicker={todayLabel()}
          title={dashboard.firstName ? `Hola, ${dashboard.firstName}` : 'Hola'}
          right={<BellButton onPress={() => router.push('/reminders')} />}
        />

        {dashboard.isLoading ? (
          <HomeSkeleton />
        ) : (
          <>
            <Hero
              label="Saldo total"
              value={formatMoney(dashboard.totals.balance)}
              footer={[
                {
                  label: 'Deuda de tarjetas (periodo)',
                  value: formatMoney(dashboard.totals.cardDebt),
                },
                { label: 'Por cobrar', value: formatMoney(dashboard.totals.toCollect) },
              ]}
            />

            {dashboard.isError ? (
              <>
                <Banner
                  icon={WifiOff}
                  title="Sin conexión"
                  subtitle="No pudimos cargar tus datos"
                  onPress={refresh}
                />
                <Button title="Reintentar" variant="ghost" onPress={refresh} />
              </>
            ) : showEmpty ? (
              <EmptyState
                icon={Wallet}
                title="Empieza registrando una cuenta"
                message="Añade tu primera cuenta para ver aquí tu saldo, tarjetas y cuotas."
                actionLabel="Nueva cuenta"
                onAction={() => router.push('/accounts/new')}
              />
            ) : (
              <>
                {dashboard.attention.length > 0 ? (
                  <>
                    <SectionHeader title="Requiere atención" />
                    <AttentionRows items={dashboard.attention} />
                  </>
                ) : null}

                <SectionHeader
                  title="Cuentas"
                  action={
                    <SectionLink label="Ver todas" onPress={() => router.push('/accounts')} />
                  }
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.accountsScroll}
                  contentContainerStyle={styles.accountsContent}
                >
                  {dashboard.accounts.map((account) => (
                    <MiniAccountCard
                      key={account.id}
                      name={account.name}
                      institution={account.financialInstitution}
                      balance={formatMoney(account.currentBalance)}
                      color={account.color}
                      onPress={() =>
                        router.push({ pathname: '/accounts/[id]', params: { id: account.id } })
                      }
                    />
                  ))}
                </ScrollView>

                {dashboard.cards.length > 0 ? (
                  <>
                    <SectionHeader title="Tarjetas" />
                    <CardsGroup cards={dashboard.cards} />
                  </>
                ) : null}

                {dashboard.week.length > 0 ? (
                  <>
                    <SectionHeader title="Esta semana" />
                    <WeekRows items={dashboard.week} accountNames={accountNames} />
                  </>
                ) : null}
              </>
            )}
          </>
        )}
      </ScreenContainer>
      <Fab onPress={openQuickActions} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  bell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    fontSize: 14,
    fontWeight: '500',
  },
  cardTile: {
    width: 34,
    height: 34,
    borderRadius: radii.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekAmount: {
    ...typography.body,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  skeletonHeader: {
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 14,
  },
  skeletonGroup: {
    padding: 14,
    gap: 12,
  },
  accountsScroll: {
    marginHorizontal: -16,
  },
  accountsContent: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
});
