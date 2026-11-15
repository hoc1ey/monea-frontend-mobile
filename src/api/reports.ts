import { api, type ApiEnvelope } from './client';

/** `GET /reports/monthly-summary` and `GET /reports/monthly-history` item. */
export interface MonthlyReportItem {
  /** `YYYY-MM` period in UTC. */
  period: string;
  totalIncomes: number;
  /** All payment methods (CORRIENTE + DIFERIDO): it is expense, not balance. */
  totalExpenses: number;
  net: number;
}

/** `GET /reports/balance-history` item. */
export interface BalanceReportItem {
  /** `YYYY-MM` period in UTC. */
  period: string;
  /** Balance at the end of the month (CORRIENTE expenses only). */
  balance: number;
}

/** GET /reports/monthly-summary — incomes, expenses and net of the current month. */
export async function getMonthlySummary(): Promise<MonthlyReportItem> {
  const { data } = await api.get<ApiEnvelope<MonthlyReportItem | { items: MonthlyReportItem[] }>>(
    '/reports/monthly-summary',
  );

  const payload = data.data;

  if ('items' in payload) {
    const first = payload.items[0];
    if (!first) {
      throw new Error('Resumen mensual vacío');
    }
    return first;
  }

  return payload;
}

/** GET /reports/monthly-history — current month + 4 previous, oldest first. */
export async function getMonthlyHistory(): Promise<MonthlyReportItem[]> {
  const { data } = await api.get<ApiEnvelope<{ items: MonthlyReportItem[] }>>(
    '/reports/monthly-history',
  );
  return data.data.items;
}

/** GET /reports/balance-history — balance at the close of the last 5 months. */
export async function getBalanceHistory(): Promise<BalanceReportItem[]> {
  const { data } = await api.get<ApiEnvelope<{ items: BalanceReportItem[] }>>(
    '/reports/balance-history',
  );
  return data.data.items;
}
