import { subDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

import type { RecurringExpenseConfig, RecurringFrequency, ReminderOffset } from '@/api/recurringExpenses';
import type { SegmentedOption, SelectOption } from '@/components/ui';
import { formatDate } from '@/lib/format';

export const recurringFrequencyLabel: Record<RecurringFrequency, string> = {
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
  YEARLY: 'Anual',
};

export const FREQUENCY_OPTIONS: SegmentedOption<RecurringFrequency>[] = [
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MONTHLY', label: 'Mensual' },
  { value: 'YEARLY', label: 'Anual' },
];

/** `dayOfWeek` follows the API: 1 (lunes) … 7 (domingo). */
export const WEEKDAY_OPTIONS: SelectOption<string>[] = [
  { value: '1', label: 'Lunes' },
  { value: '2', label: 'Martes' },
  { value: '3', label: 'Miércoles' },
  { value: '4', label: 'Jueves' },
  { value: '5', label: 'Viernes' },
  { value: '6', label: 'Sábado' },
  { value: '7', label: 'Domingo' },
];

export const DAY_OF_MONTH_OPTIONS: SelectOption<string>[] = Array.from({ length: 31 }, (_, index) => ({
  value: String(index + 1),
  label: String(index + 1),
}));

/** Optional day for yearly schedules: empty value leaves the API default (day 1). */
export const OPTIONAL_DAY_OF_MONTH_OPTIONS: SelectOption<string>[] = [
  { value: '', label: 'Día 1 (predeterminado)' },
  ...DAY_OF_MONTH_OPTIONS,
];

export const MONTH_OPTIONS: SelectOption<string>[] = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
].map((label, index) => ({ value: String(index + 1), label }));

export const REMINDER_OFFSET_OPTIONS: SelectOption<ReminderOffset>[] = [
  { value: 'SAME_DAY', label: 'Mismo día' },
  { value: 'ONE_DAY_BEFORE', label: '1 día antes' },
];

export const REMINDER_HOUR_OPTIONS: SelectOption<string>[] = Array.from({ length: 24 }, (_, index) => ({
  value: String(index),
  label: `${String(index).padStart(2, '0')}:00`,
}));

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Human label for the "Recordatorio" row, e.g. "Domingo 08:00 (día antes)".
 * Falls back to the offset label when the next run is unknown.
 */
export function recurringReminderLabel(
  config: RecurringExpenseConfig,
  timezone: string,
): string {
  if (!config.reminderEnabled || config.reminderHour == null || !config.reminderOffset) {
    return 'Desactivado';
  }

  const hour = `${String(config.reminderHour).padStart(2, '0')}:00`;
  const offsetLabel = config.reminderOffset === 'ONE_DAY_BEFORE' ? '(día antes)' : '(mismo día)';

  if (config.nextRunAt) {
    const run = toZonedTime(config.nextRunAt, timezone);
    const reminder = config.reminderOffset === 'ONE_DAY_BEFORE' ? subDays(run, 1) : run;
    return `${capitalize(formatDate(reminder, 'EEEE'))} ${hour} ${offsetLabel}`;
  }

  return `${config.reminderOffset === 'ONE_DAY_BEFORE' ? '1 día antes' : 'Mismo día'} · ${hour}`;
}
