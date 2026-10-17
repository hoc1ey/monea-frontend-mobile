import { api, type ApiEnvelope } from './client';

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

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** GET /expenses?amountPending=true — recurring expenses awaiting an amount. */
export async function getPendingExpenses(): Promise<Expense[]> {
  const { data } = await api.get<ApiEnvelope<Paginated<Expense>>>('/expenses', {
    params: { amountPending: true, limit: 100 },
  });
  return data.data.items;
}
