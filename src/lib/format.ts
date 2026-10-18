import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** Rounds a money value to 2 decimals, avoiding accumulated float error. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Sums money values and rounds the result to 2 decimals. */
export function sumMoney(values: number[]): number {
  return roundMoney(values.reduce((total, value) => total + value, 0));
}

export function formatMoney(value: number): string {
  const sign = value < 0 ? '-' : '';
  const [integer, decimals] = Math.abs(value).toFixed(2).split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}$${grouped}.${decimals}`;
}

export function formatDate(value: Date | string, pattern = "d 'de' MMMM 'de' yyyy"): string {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, pattern, { locale: es });
}

export function formatPeriod(period: string): string {
  const [year, month] = period.split('-');
  const index = Number(month) - 1;
  return `${MONTHS[index] ?? month} ${year}`;
}
