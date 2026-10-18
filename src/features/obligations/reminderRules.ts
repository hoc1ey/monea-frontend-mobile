import { fromZonedTime, toZonedTime } from 'date-fns-tz';

import type {
  ObligationReminder,
  ObligationReminderInput,
  ReminderFrequency,
} from '@/api/obligations';
import type { SegmentedOption, SelectOption } from '@/components/ui';

export const REMINDER_FREQUENCY_OPTIONS: SegmentedOption<ReminderFrequency>[] = [
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

/** Optional yearly day: empty leaves the API default (day 1). */
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

export const HOUR_OPTIONS: SelectOption<string>[] = Array.from({ length: 24 }, (_, index) => ({
  value: String(index),
  label: `${String(index).padStart(2, '0')}:00`,
}));

/** A single installment uses an exact `reminderAt`; more use a recurrence. */
export type ReminderMode = 'single' | 'recurring';

export function reminderModeFor(installmentsCount: number): ReminderMode {
  return installmentsCount <= 1 ? 'single' : 'recurring';
}

export interface ReminderState {
  enabled: boolean;
  /** Single-installment reminder: exact date and hour. */
  atDate: Date;
  atHour: string;
  /** Multi-installment reminder: recurrence + hour. */
  frequency: ReminderFrequency;
  dayOfWeek: string;
  dayOfMonth: string;
  month: string;
  yearDayOfMonth: string;
  hour: string;
}

export function defaultReminderState(): ReminderState {
  return {
    enabled: true,
    atDate: new Date(),
    atHour: '9',
    frequency: 'MONTHLY',
    dayOfWeek: '1',
    dayOfMonth: '1',
    month: '1',
    yearDayOfMonth: '',
    hour: '9',
  };
}

/**
 * Clears the reminder fields that no longer apply after changing the number of
 * installments (1 ⇄ more), as required by F11.
 */
export function clearReminderForMode(state: ReminderState, installmentsCount: number): ReminderState {
  if (reminderModeFor(installmentsCount) === 'single') {
    return {
      ...state,
      frequency: 'MONTHLY',
      dayOfWeek: '1',
      dayOfMonth: '1',
      month: '1',
      yearDayOfMonth: '',
      hour: '9',
    };
  }

  return {
    ...state,
    atDate: new Date(),
    atHour: '9',
  };
}

/**
 * Builds the reminder fields of the request. A disabled reminder only sends
 * `reminderEnabled: false`; a single installment sends `reminderAt` (UTC with
 * `min`/`seg` at 0); several installments send the recurrence + `reminderHour`.
 */
export function buildReminderInput(
  state: ReminderState,
  installmentsCount: number,
  timezone: string,
): ObligationReminderInput {
  if (!state.enabled) {
    return { reminderEnabled: false };
  }

  if (reminderModeFor(installmentsCount) === 'single') {
    const wallClock = new Date(
      state.atDate.getFullYear(),
      state.atDate.getMonth(),
      state.atDate.getDate(),
      Number(state.atHour),
      0,
      0,
      0,
    );
    return { reminderEnabled: true, reminderAt: fromZonedTime(wallClock, timezone).toISOString() };
  }

  const input: ObligationReminderInput = {
    reminderEnabled: true,
    reminderFrequency: state.frequency,
    reminderHour: Number(state.hour),
  };

  if (state.frequency === 'WEEKLY') {
    input.reminderDayOfWeek = Number(state.dayOfWeek);
  } else if (state.frequency === 'MONTHLY') {
    input.reminderDayOfMonth = Number(state.dayOfMonth);
  } else {
    input.reminderMonth = Number(state.month);
    if (state.yearDayOfMonth !== '') {
      input.reminderDayOfMonth = Number(state.yearDayOfMonth);
    }
  }

  return input;
}

/** Rebuilds the editable reminder state from a stored obligation (edit mode). */
export function initialReminderState(
  obligation: ObligationReminder & { installmentsCount: number },
  timezone: string,
): ReminderState {
  const base = defaultReminderState();

  if (reminderModeFor(obligation.installmentsCount) === 'single') {
    const at = obligation.reminderAt ? toZonedTime(obligation.reminderAt, timezone) : new Date();
    return { ...base, enabled: obligation.reminderEnabled, atDate: at, atHour: String(at.getHours()) };
  }

  const yearly = obligation.reminderFrequency === 'YEARLY';

  return {
    ...base,
    enabled: obligation.reminderEnabled,
    frequency: obligation.reminderFrequency ?? base.frequency,
    dayOfWeek: obligation.reminderDayOfWeek != null ? String(obligation.reminderDayOfWeek) : base.dayOfWeek,
    dayOfMonth:
      obligation.reminderDayOfMonth != null ? String(obligation.reminderDayOfMonth) : base.dayOfMonth,
    month: obligation.reminderMonth != null ? String(obligation.reminderMonth) : base.month,
    yearDayOfMonth:
      yearly && obligation.reminderDayOfMonth != null ? String(obligation.reminderDayOfMonth) : '',
    hour: obligation.reminderHour != null ? String(obligation.reminderHour) : base.hour,
  };
}
