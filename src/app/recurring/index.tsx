import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import { toZonedTime } from 'date-fns-tz';
import { router } from 'expo-router';
import { Repeat, WifiOff } from 'lucide-react-native';

import type { RecurringExpenseConfig } from '@/api/recurringExpenses';
import {
  Banner,
  Button,
  EmptyState,
  Group,
  LargeHeader,
  Row,
  ScreenContainer,
  Skeleton,
  Tag,
  TopBar
} from '@/components/ui';
import { recurringFrequencyLabel } from '@/features/recurring/recurring';
import { useRecurringExpenses } from '@/features/recurring/useRecurringExpenses';
import { useSetRecurringActive } from '@/features/recurring/useRecurringMutations';
import { formatDate, formatMoney } from '@/lib/format';
import { detectTimezone } from '@/lib/timezone';
import { useAuthStore } from '@/stores/auth';
import { radii, typography, useThemeColors } from '@/theme';

function ListSkeleton() {
  const colors = useThemeColors();

  return (
    <View style={[styles.skeletonGroup, { backgroundColor: colors.surface }]}>
      <Skeleton height={32} />
      <Skeleton height={32} />
      <Skeleton height={32} />
    </View>
  );
}

function RecurringRow({ config }: { config: RecurringExpenseConfig }) {
  const colors = useThemeColors();
  const timezone = useAuthStore((state) => state.user?.timezone) ?? detectTimezone();
  const activeMutation = useSetRecurringActive();

  const nextLabel = config.nextRunAt
    ? formatDate(toZonedTime(config.nextRunAt, timezone), 'd MMM')
    : '—';

  const toggle = (value: boolean) => {
    activeMutation.mutate({ id: config.id, isActive: value });
  };

  return (
    <Row
      icon={Repeat}
      title={config.name}
      subtitle={`${recurringFrequencyLabel[config.frequency]} · próximo ${nextLabel}`}
      onPress={() =>
        router.push({ pathname: '/recurring/[id]', params: { id: config.id } })
      }
      right={
        <View style={styles.right}>
          {config.isVariableAmount ? (
            <Tag label="Variable" variant="acc" />
          ) : (
            <Text style={[styles.amount, { color: colors.text }]}>
              {formatMoney(config.amount ?? 0)}
            </Text>
          )}
        </View>
      }
    />
  );
}

export default function RecurringListScreen() {
  const colors = useThemeColors();
  const query = useRecurringExpenses();

  const openNew = () =>
    router.push({ pathname: '/movements/expense/new', params: { kind: 'recurrente' } });

  const renderContent = () => {
    if (query.isPending) {
      return <ListSkeleton />;
    }

    if (query.isError) {
      return (
        <>
          <Banner
            icon={WifiOff}
            title="Sin conexión"
            subtitle="No pudimos cargar tus recurrencias"
            onPress={() => void query.refetch()}
          />
          <Button title="Reintentar" variant="ghost" onPress={() => void query.refetch()} />
        </>
      );
    }

    const items = query.data ?? [];

    if (items.length === 0) {
      return (
        <EmptyState
          icon={Repeat}
          title="Aún no tienes recurrencias"
          message="Programa un egreso semanal, mensual o anual y se generará solo."
          actionLabel="Nuevo recurrente"
          onAction={openNew}
        />
      );
    }

    return (
      <>
        <Group>
          {items.map((config) => (
            <RecurringRow key={config.id} config={config} />
          ))}
        </Group>
        <View style={styles.newButton}>

          <Button
            title="Nuevo recurrente"
            variant="ghost"
            onPress={openNew}

          />
        </View>
      </>
    );
  };

  return (
    <>
      <TopBar title="Recurrentes" onBack={() => router.back()} />
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
        <LargeHeader title="Recurrentes" subtitle="Configuraciones programadas" />
        {renderContent()}
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amount: {
    ...typography.body,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  newButton: {
    marginTop: 14,
  },
  skeletonGroup: {
    gap: 12,
    padding: 14,
    borderRadius: radii.card,
    marginTop: 12,
  },
});
