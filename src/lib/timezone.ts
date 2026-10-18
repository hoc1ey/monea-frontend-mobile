export const TIMEZONE_OPTIONS = [
  'America/Guayaquil',
  'America/Bogota',
  'America/Mexico_City',
] as const;

const FALLBACK_TIMEZONE = 'America/Guayaquil';

const TIMEZONE_LABELS: Record<string, string> = {
  'America/Guayaquil': 'Guayaquil (GMT-5)',
  'America/Bogota': 'Bogotá (GMT-5)',
  'America/Mexico_City': 'Ciudad de México (GMT-6)',
};

export interface TimezoneOption {
  value: string;
  label: string;
}

/** Best-effort device timezone detection; falls back to the prototype default. */
export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TIMEZONE;
  } catch {
    return FALLBACK_TIMEZONE;
  }
}

/** Friendly label for an IANA timezone; unknown zones fall back to their city. */
export function timezoneLabel(value: string): string {
  const label = TIMEZONE_LABELS[value];

  if (label) {
    return label;
  }

  const city = value.split('/').pop() ?? value;
  return city.replace(/_/g, ' ');
}

/** Deduplicated select options built from IANA timezone ids. */
export function buildTimezoneOptions(values: readonly string[]): TimezoneOption[] {
  return Array.from(new Set(values)).map((value) => ({ value, label: timezoneLabel(value) }));
}
