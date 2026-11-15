import { toZonedTime } from 'date-fns-tz';

/** Short chip label for a period (`2026-10` → `Oct`). */
export { shortMonthLabel } from '@/lib/format';

/** `true` when `value` is a well-formed `YYYY-MM` period. */
export function isValidPeriod(value: string | undefined): value is string {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

/** Current period (`YYYY-MM`) in the given IANA timezone. */
export function currentPeriodInTimezone(timezone: string): string {
  const zoned = toZonedTime(new Date(), timezone);
  return `${zoned.getFullYear()}-${String(zoned.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Period range offered by the wheel picker: 3 years back, 6 months forward.
 */
export function buildPeriodRange(current: string, before = 36, after = 6): string[] {
  const [year, month] = current.split('-').map(Number);
  const periods: string[] = [];

  for (let offset = -before; offset <= after; offset += 1) {
    const date = new Date(year, month - 1 + offset, 1);
    periods.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }

  return periods;
}
