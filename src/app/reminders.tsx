import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';
import { differenceInCalendarDays, format, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { router } from 'expo-router';
import {
  ArrowDown,
  ArrowUp,
  Bell,
  CreditCard,
  Landmark,
  Repeat,
  WifiOff,
} from 'lucide-react-native';

import { getReminders, type Reminder, type ReminderType } from '@/api/notifications';
import {
  Banner,
  EmptyState,
  Group,
  LargeHeader,
  Row,
  ScreenContainer,
  SectionHeader,
  Skeleton,
  Tag,
  TopBar,
  type IconComponent,
} from '@/components/ui';
import { formatMoney } from '@/lib/format';
import { detectTimezone } from '@/lib/timezone';
import { useAuthStore } from '@/stores/auth';
import { useThemeColors } from '@/theme';

const TYPE_META: Record<ReminderType, { label: string; icon: IconComponent }> = {
  CREDIT_CARD_PAYMENT: { label: 'Tarjeta', icon: CreditCard },
  RECURRING_EXPENSE: { label: 'Recurrente', icon: Repeat },
  COLLECTION: { label: 'Cobro', icon: ArrowDown },
  LOAN: { label: 'Préstamo', icon: Landmark },
  DEBT: { label: 'Deuda', icon: ArrowUp },
};

type Bucket = 'today' | 'week' | 'later';

const SECTIONS: { key: Bucket; title: string }[] = [
  { key: 'today', title: 'Hoy' },
  { key: 'week', title: 'Esta semana' },
  { key: 'later', title: 'Más adelante' },
];

interface GroupedReminder {
  reminder: Reminder;
  scheduled: Date;
  days: number;
}

function daysUntil(scheduled: Date, now: Date): number {
  return differenceInCalendarDays(startOfDay(scheduled), startOfDay(now));
}

function bucketFor(days: number): Bucket {
  if (days <= 0) {
    return 'today';
  }
  return days <= 7 ? 'week' : 'later';
}

function remainingLabel(days: number): string {
  if (days <= 0) {
    return 'Hoy';
  }
  return days === 1 ? 'Mañana' : `${days} días`;
}

/** Recordatorios próximos agrupados por fecha en la zona del usuario (F04). */
export default function RemindersScreen() {
  const colors = useThemeColors();
  const timezone = useAuthStore((state) => state.user?.timezone) ?? detectTimezone();
  const query = useQuery({ queryKey: ['notifications', 'reminders'], queryFn: getReminders });

  const grouped = useMemo(() => {
    const now = toZonedTime(new Date(), timezone);
    const buckets: Record<Bucket, GroupedReminder[]> = { today: [], week: [], later: [] };

    for (const reminder of query.data ?? []) {
      const scheduled = toZonedTime(reminder.scheduledAt, timezone);
      const days = daysUntil(scheduled, now);
      buckets[bucketFor(days)].push({ reminder, scheduled, days });
    }

    return buckets;
  }, [query.data, timezone]);

  const reminders = query.data ?? [];

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar title="Recordatorios" onBack={() => router.back()} />
      <ScreenContainer>
        <LargeHeader title="Próximos" subtitle="Notificaciones programadas" />

        {query.isPending ? (
          <Group style={styles.skeletonGroup}>
            <Skeleton width="55%" height={20} />
            <Skeleton width="80%" height={20} />
            <Skeleton width="70%" height={20} />
          </Group>
        ) : null}

        {query.isError ? (
          <Banner
            icon={WifiOff}
            title="Sin conexión"
            subtitle="No pudimos cargar tus recordatorios"
            onPress={() => query.refetch()}
          />
        ) : null}

        {query.isSuccess && reminders.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Sin recordatorios"
            message="Aquí verás tus próximos avisos."
          />
        ) : null}

        {query.isSuccess && reminders.length > 0
          ? SECTIONS.map(({ key, title }) => {
              const items = grouped[key];
              if (items.length === 0) {
                return null;
              }

              return (
                <View key={key}>
                  <SectionHeader title={title} />
                  <Group>
                    {items.map(({ reminder, scheduled, days }) => {
                      const meta = TYPE_META[reminder.type];
                      const isCard = reminder.type === 'CREDIT_CARD_PAYMENT';

                      return (
                        <Row
                          key={reminder.id}
                          icon={meta.icon}
                          title={reminder.title}
                          subtitle={`${meta.label} · ${format(scheduled, 'HH:mm')}`}
                          right={isCard ? <Tag variant="acc" label={remainingLabel(days)} /> : undefined}
                          value={
                            !isCard && reminder.amount != null
                              ? formatMoney(reminder.amount)
                              : undefined
                          }
                        />
                      );
                    })}
                  </Group>
                </View>
              );
            })
          : null}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  skeletonGroup: {
    padding: 14,
    gap: 12,
  },
});
