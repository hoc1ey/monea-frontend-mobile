import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';
import { Bell, Wallet, WifiOff } from 'lucide-react-native';

import { Fab } from '@/components/navigation/Fab';
import {
  Banner,
  Button,
  EmptyState,
  Hero,
  LargeHeader,
  ScreenContainer,
  Skeleton,
} from '@/components/ui';
import { useHomeDashboard } from '@/features/home/useHomeDashboard';
import { formatDate, formatMoney } from '@/lib/format';
import { useUiStore } from '@/stores/ui';
import { ICON_STROKE, radii, useThemeColors } from '@/theme';

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

export default function HomeScreen() {
  const colors = useThemeColors();
  const openQuickActions = useUiStore((state) => state.openQuickActions);
  const dashboard = useHomeDashboard();

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
            ) : null}
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
  skeletonHeader: {
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 14,
  },
  skeletonGroup: {
    padding: 14,
    gap: 12,
  },
});
