export const TIMEZONE_OPTIONS = [
  'America/Guayaquil',
  'America/Bogota',
  'America/Mexico_City',
] as const;

const FALLBACK_TIMEZONE = 'America/Guayaquil';

/** Best-effort device timezone detection; falls back to the prototype default. */
export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TIMEZONE;
  } catch {
    return FALLBACK_TIMEZONE;
  }
}
