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

/** Deferred expense installment returned inside `GET /expenses/:id`. */
export interface ExpenseInstallment {
  id: string;
  expenseId: string;
  creditCardId: string;
  number: number;
  amount: number;
  /** `YYYY-MM`. */
  period: string;
  isPaid: boolean;
  cardPaymentId: string | null;
}

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
  /** Only present for deferred expenses in the detail endpoint. */
  installmentPlan?: ExpenseInstallment[];
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

/** Body accepted by `POST /expenses` (never includes `userId`). */
export interface ExpenseInput {
  accountId: string;
  name: string;
  amount: number;
  description?: string;
  date?: string;
  paymentMethod?: ExpensePaymentMethod;
  creditCardId?: string;
  installments?: number;
  graceMonths?: number;
}

export type ExpenseUpdateInput = Partial<ExpenseInput>;

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

/** GET /expenses/:id — single expense; includes `installmentPlan` when deferred. */
export async function getExpense(id: string): Promise<Expense> {
  const { data } = await api.get<ApiEnvelope<Expense>>(`/expenses/${id}`);
  return data.data;
}

/** POST /expenses — registers an expense and returns it. */
export async function createExpense(input: ExpenseInput): Promise<Expense> {
  const { data } = await api.post<ApiEnvelope<Expense>>('/expenses', input);
  return data.data;
}

/** PATCH /expenses/:id — updates the allowed subset of fields. */
export async function updateExpense(id: string, input: ExpenseUpdateInput): Promise<Expense> {
  const { data } = await api.patch<ApiEnvelope<Expense>>(`/expenses/${id}`, input);
  return data.data;
}

/** PATCH /expenses/:id/amount — fixes the amount of a variable recurring expense. */
export async function setExpenseAmount(id: string, amount: number): Promise<Expense> {
  const { data } = await api.patch<ApiEnvelope<Expense>>(`/expenses/${id}/amount`, { amount });
  return data.data;
}

/** DELETE /expenses/:id — `400` for automatic sources (except `RECURRING`) or paid installments. */
export async function deleteExpense(id: string): Promise<void> {
  await api.delete<ApiEnvelope<null>>(`/expenses/${id}`);
}
