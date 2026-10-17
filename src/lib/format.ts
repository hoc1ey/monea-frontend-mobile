import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function formatMoney(value: number): string {
  const sign = value < 0 ? '-' : '';
  const [integer, decimals] = Math.abs(value).toFixed(2).split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}$${grouped}.${decimals}`;
}

export function formatDate(value: Date | string, pattern = "d 'de' MMMM yyyy"): string {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, pattern, { locale: es });
}

export function formatPeriod(period: string): string {
  const [year, month] = period.split('-');
  const index = Number(month) - 1;
  return `${MONTHS[index] ?? month} ${year}`;
}
