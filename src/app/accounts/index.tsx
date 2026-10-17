import { RefreshControl, StyleSheet, View } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';
import { Wallet, WifiOff } from 'lucide-react-native';

import type { Account } from '@/api/accounts';
import {
  Banner,
  Button,
  EmptyState,
  Group,
  Note,
  Row,
  ScreenContainer,
  Segmented,
  Skeleton,
  TopBar,
  type SegmentedOption,
} from '@/components/ui';
import { useAccounts } from '@/features/accounts/useAccounts';
import { formatMoney } from '@/lib/format';
import { ICON_STROKE, radii, useThemeColors } from '@/theme';

type AccountsTab = 'accounts' | 'cards';

const TABS: SegmentedOption<AccountsTab>[] = [
  { value: 'accounts', label: 'Cuentas' },
  { value: 'cards', label: 'Tarjetas' },
];

/** 34 dp tile tinted with the account color at 13 % (`#RRGGBB` + `22`). */
function AccountTile({ color }: { color: string }) {
  return (
    <View style={[styles.tile, { backgroundColor: `${color}22` }]}>
      <Wallet size={18} color={color} strokeWidth={ICON_STROKE} />
    </View>
  );
}

function AccountsSkeleton() {
  const colors = useThemeColors();

  return (
    <View style={[styles.skeletonGroup, { backgroundColor: colors.surface }]}>
      <Skeleton height={32} />
      <Skeleton height={32} />
      <Skeleton height={32} />
    </View>
  );
}

function AccountRows({ accounts }: { accounts: Account[] }) {
  return (
    <Group>
      {accounts.map((account) => (
        <Row
          key={account.id}
          leading={<AccountTile color={account.color} />}
          title={account.name}
          subtitle={account.financialInstitution}
          value={formatMoney(account.currentBalance)}
          onPress={() => router.push({ pathname: '/accounts/[id]', params: { id: account.id } })}
        />
      ))}
    </Group>
  );
}

export default function AccountsScreen() {
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ tab?: string }>();
  const tab: AccountsTab = params.tab === 'cards' ? 'cards' : 'accounts';
  const accounts = useAccounts();

  const refresh = () => {
    void accounts.refetch();
  };

  const list = accounts.data ?? [];

  return (
    <>
      <TopBar title={tab === 'cards' ? 'Tarjetas' : 'Cuentas'} onBack={() => router.back()} />
      <ScreenContainer
        refreshControl={
          tab === 'accounts' ? (
            <RefreshControl
              refreshing={!accounts.isPending && accounts.isFetching}
              onRefresh={refresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          ) : undefined
        }
      >
        <View style={styles.segmentWrap}>
          <Segmented options={TABS} value={tab} onChange={(value) => router.setParams({ tab: value })} />
        </View>

        {tab === 'cards' ? (
          <Note>Las tarjetas de crédito se implementan en la feature F07.</Note>
        ) : accounts.isPending ? (
          <AccountsSkeleton />
        ) : accounts.isError ? (
          <>
            <Banner
              icon={WifiOff}
              title="Sin conexión"
              subtitle="No pudimos cargar tus cuentas"
              onPress={refresh}
            />
            <Button title="Reintentar" variant="ghost" onPress={refresh} />
          </>
        ) : list.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Aún no tienes cuentas"
            message="Registra tu primera cuenta para empezar a controlar tus saldos."
            actionLabel="Nueva cuenta"
            onAction={() => router.push('/accounts/new')}
          />
        ) : (
          <>
            <AccountRows accounts={list} />
            <Button
              title="Nueva cuenta"
              variant="ghost"
              onPress={() => router.push('/accounts/new')}
              style={styles.newButton}
            />
          </>
        )}
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  segmentWrap: {
    paddingTop: 12,
  },
  tile: {
    width: 34,
    height: 34,
    borderRadius: radii.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonGroup: {
    gap: 12,
    padding: 14,
    borderRadius: radii.card,
  },
  newButton: {
    marginTop: 14,
  },
});
