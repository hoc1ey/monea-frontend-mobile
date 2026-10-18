import { useMemo } from 'react';

import { useQueries } from '@tanstack/react-query';
import { differenceInCalendarDays, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

import { getAccounts } from '@/api/accounts';
import { getReminders } from '@/api/notifications';
import { getMe } from '@/api/users';
import { useCardsOverview } from '@/features/cards/useCardsOverview';
import { sumMoney } from '@/lib/format';
import { detectTimezone } from '@/lib/timezone';
import { useAuthStore } from '@/stores/auth';

/** Counters and totals shown by the "Más" menu (F15). */
export interface MoreOverview {
  isLoading: boolean;
  isRefreshing: boolean;
  isError: boolean;
  accounts: { count: number; balance: number };
  cards: { count: number; debt: number };
  reminders: { upcoming: number };
  profile: { name: string; timezone: string };
  refetch: () => Promise<unknown>;
}

/**
 * Aggregates the "Más" menu: accounts, cards debt, upcoming reminders and the
 * user profile. Reuses the shared accounts/cards/profile cache keys.
 */
export function useMoreOverview(): MoreOverview {
  const authUser = useAuthStore((state) => state.user);
  const timezone = authUser?.timezone ?? detectTimezone();

  const [accountsQuery, remindersQuery, meQuery] = useQueries({
    queries: [
      { queryKey: ['accounts'], queryFn: getAccounts },
      { queryKey: ['notifications', 'reminders'], queryFn: getReminders },
      { queryKey: ['users', 'me'], queryFn: getMe },
    ],
  });

  const cards = useCardsOverview();

  const now = useMemo(() => toZonedTime(new Date(), timezone), [timezone]);

  const upcoming = useMemo(
    () =>
      (remindersQuery.data ?? []).filter((reminder) => {
        const scheduled = toZonedTime(reminder.scheduledAt, timezone);
        return differenceInCalendarDays(startOfDay(scheduled), startOfDay(now)) >= 0;
      }).length,
    [remindersQuery.data, timezone, now],
  );

  const accounts = accountsQuery.data ?? [];
  const queries = [accountsQuery, remindersQuery, meQuery];

  return {
    isLoading: queries.some((query) => query.isPending) || cards.isLoading,
    isRefreshing:
      !queries.some((query) => query.isPending) && (queries.some((query) => query.isFetching) || cards.isRefreshing),
    isError: queries.some((query) => query.isError) || cards.isError,
    accounts: {
      count: accounts.length,
      balance: sumMoney(accounts.map((account) => account.currentBalance)),
    },
    cards: {
      count: cards.items.length,
      debt: cards.totalDebt,
    },
    reminders: { upcoming },
    profile: {
      name: meQuery.data?.name ?? authUser?.name ?? '',
      timezone: meQuery.data?.timezone ?? timezone,
    },
    refetch: () => Promise.all([...queries.map((query) => query.refetch()), cards.refetch()]),
  };
}
