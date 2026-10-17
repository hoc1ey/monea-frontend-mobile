import { toZonedTime } from 'date-fns-tz';

const MONTHS_SHORT = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

/** `true` when `value` is a well-formed `YYYY-MM` period. */
export function isValidPeriod(value: string | undefined): value is string {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

/** Current period (`YYYY-MM`) in the given IANA timezone. */
export function currentPeriodInTimezone(timezone: string): string {
  const zoned = toZonedTime(new Date(), timezone);
  return `${zoned.getFullYear()}-${String(zoned.getMonth() + 1).padStart(2, '0')}`;
}

/** Periods offered by the F07 chips: 3 months back and 2 forward. */
export function buildPeriods(current: string, before = 3, after = 2): string[] {
  const [year, month] = current.split('-').map(Number);
  const periods: string[] = [];

  for (let offset = -before; offset <= after; offset += 1) {
    const date = new Date(year, month - 1 + offset, 1);
    periods.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }

  return periods;
}

/** Short chip label for a period (`2026-10` → `Oct`). */
export function shortMonthLabel(period: string): string {
  const [, month] = period.split('-');
  const index = Number(month) - 1;
  return MONTHS_SHORT[index] ?? month;
}
