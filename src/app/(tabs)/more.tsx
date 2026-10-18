import { RefreshControl, StyleSheet, View } from 'react-native';

import { router } from 'expo-router';
import { Bell, CreditCard, Settings, User, Wallet, WifiOff } from 'lucide-react-native';

import {
  Banner,
  Group,
  LargeHeader,
  Row,
  ScreenContainer,
  SectionHeader,
  Skeleton,
} from '@/components/ui';
import { useMoreOverview } from '@/features/more/useMoreOverview';
import { formatMoney } from '@/lib/format';
import { radii, useThemeColors } from '@/theme';

function MoreSkeleton() {
  const colors = useThemeColors();

  return (
    <View style={[styles.skeletonGroup, { backgroundColor: colors.surface }]}>
      <Skeleton height={32} />
      <Skeleton height={32} />
      <Skeleton height={32} />
    </View>
  );
}

/** `/more` — finance, account and settings menu (F15). */
export default function MoreScreen() {
  const colors = useThemeColors();
  const overview = useMoreOverview();
  const { accounts, cards, reminders, profile } = overview;

  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl
          refreshing={overview.isRefreshing}
          onRefresh={() => void overview.refetch()}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
    >
      <LargeHeader title="Más" subtitle="Cuentas y ajustes" />

      {overview.isError ? (
        <Banner
          icon={WifiOff}
          title="Sin conexión"
          subtitle="No pudimos cargar tus datos"
          onPress={() => void overview.refetch()}
          style={styles.banner}
        />
      ) : null}

      <SectionHeader title="Finanzas" />
      {overview.isLoading ? (
        <MoreSkeleton />
      ) : (
        <Group>
          <Row
            icon={Wallet}
            title="Cuentas"
            subtitle={`${accounts.count} cuentas · ${formatMoney(accounts.balance)}`}
            onPress={() => router.push('/accounts')}
          />
          <Row
            icon={CreditCard}
            title="Tarjetas"
            subtitle={`${cards.count} tarjetas · deuda ${formatMoney(cards.debt)}`}
            onPress={() => router.push({ pathname: '/accounts', params: { tab: 'cards' } })}
          />
        </Group>
      )}

      <SectionHeader title="Cuenta" />
      {overview.isLoading ? (
        <MoreSkeleton />
      ) : (
        <Group>
          <Row
            icon={Bell}
            title="Recordatorios"
            subtitle={`${reminders.upcoming} hoy o próximos`}
            onPress={() => router.push('/reminders')}
          />
          <Row
            icon={User}
            title="Perfil"
            subtitle={`${profile.name} · ${profile.timezone}`}
            onPress={() => router.push('/profile')}
          />
          <Row
            icon={Settings}
            title="Ajustes"
            subtitle="Apariencia, seguridad, dispositivos"
            onPress={() => router.push('/settings')}
          />
        </Group>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginTop: 16,
  },
  skeletonGroup: {
    gap: 12,
    padding: 14,
    borderRadius: radii.card,
  },
});
