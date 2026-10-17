import { api, type ApiEnvelope } from './client';
import type { Paginated } from './types';

export type { Paginated } from './types';

export type ExpensePaymentMethod = 'CORRIENTE' | 'DIFERIDO';

export type ExpenseSourceType =
  | 'MANUAL'
  | 'RECURRING'
  | 'CARD_PAYMENT'
  | 'LOAN_CREATION'
  | 'DEBT_PAYMENT'
  | 'SHOPPING_LIST';

export interface Expense {
  id: string;
  userId: string;
  accountId: string;
  name: string;
  amount: number;
  description: string | null;
  date: string;
  paymentMethod: ExpensePaymentMethod;
  creditCardId: string | null;
  installments: number | null;
  graceMonths: number | null;
  /** `true` for variable recurring expenses whose amount still has to be set. */
  amountPending: boolean;
  recurringConfigId: string | null;
  occurrenceDate: string | null;
  sourceType: ExpenseSourceType;
}

/** Optional filters accepted by `GET /expenses` (only documented fields). */
export interface ExpenseQuery {
  page?: number;
  limit?: number;
  accountId?: string;
  creditCardId?: string;
  paymentMethod?: ExpensePaymentMethod;
  amountPending?: boolean;
  from?: string;
  to?: string;
}

/** GET /expenses — paginated expenses ordered by `date` DESC. */
export async function getExpenses(params: ExpenseQuery = {}): Promise<Paginated<Expense>> {
  const { data } = await api.get<ApiEnvelope<Paginated<Expense>>>('/expenses', { params });
  return data.data;
}

/** GET /expenses?amountPending=true — recurring expenses awaiting an amount. */
export async function getPendingExpenses(): Promise<Expense[]> {
  const page = await getExpenses({ amountPending: true, limit: 100 });
  return page.items;
}
