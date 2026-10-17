import { api, type ApiEnvelope } from './client';

export type ObligationStatus = 'PENDING' | 'PARTIAL' | 'PAID';

/** A single installment shared by collections, loans and debts. */
export interface ObligationInstallment {
  id: string;
  number: number;
  amount: number;
  /** ISO UTC instant the installment is due. */
  dueDate: string;
  isPaid: boolean;
  paidAt: string | null;
  /** Income generated when a collection/loan installment is paid. */
  incomeId?: string | null;
  /** Expense generated when a debt installment is paid. */
  expenseId?: string | null;
}

/** Money you collect. Each paid installment creates an income. */
export interface Collection {
  id: string;
  userId: string;
  personName: string;
  totalAmount: number;
  installmentsCount: number;
  description: string | null;
  status: ObligationStatus;
  paidAmount?: number;
  pendingAmount?: number;
  installments?: ObligationInstallment[];
}

/** Money you lend. Creating it generates a CORRIENTE expense. */
export interface Loan {
  id: string;
  userId: string;
  accountId: string;
  expenseId: string;
  personName: string;
  totalAmount: number;
  installmentsCount: number;
  description: string | null;
  status: ObligationStatus;
  paidAmount?: number;
  pendingAmount?: number;
  installments?: ObligationInstallment[];
}

/** Money you owe. Each paid installment creates a CORRIENTE expense. */
export interface Debt {
  id: string;
  userId: string;
  personName: string;
  totalAmount: number;
  installmentsCount: number;
  status: ObligationStatus;
  paidAmount?: number;
  pendingAmount?: number;
  installments?: ObligationInstallment[];
}

/** GET /collections — collections with `paidAmount` and `pendingAmount`. */
export async function getCollections(): Promise<Collection[]> {
  const { data } = await api.get<ApiEnvelope<Collection[]>>('/collections');
  return data.data;
}

/** GET /loans — loans with `paidAmount` and `pendingAmount`. */
export async function getLoans(): Promise<Loan[]> {
  const { data } = await api.get<ApiEnvelope<Loan[]>>('/loans');
  return data.data;
}

/** GET /debts — debts with `paidAmount` and `pendingAmount`. */
export async function getDebts(): Promise<Debt[]> {
  const { data } = await api.get<ApiEnvelope<Debt[]>>('/debts');
  return data.data;
}
