import { api, type ApiEnvelope } from './client';

export type ObligationStatus = 'PENDING' | 'PARTIAL' | 'PAID';

export type ReminderFrequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

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

/**
 * Reminder fields present on the three obligation models. A single-installment
 * obligation uses `reminderAt`; a multi-installment one uses the recurrence
 * fields (`reminderFrequency` + day/month + `reminderHour`).
 */
export interface ObligationReminder {
  reminderEnabled: boolean;
  reminderFrequency: ReminderFrequency | null;
  reminderDayOfWeek: number | null;
  reminderDayOfMonth: number | null;
  reminderMonth: number | null;
  /** ISO UTC instant with the exact reminder hour (single installment). */
  reminderAt: string | null;
  reminderHour: number | null;
}

/** Money you collect. Each paid installment creates an income. */
export interface Collection extends ObligationReminder {
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
export interface Loan extends ObligationReminder {
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
export interface Debt extends ObligationReminder {
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

/** Reminder fields accepted by the create/update DTOs. */
export interface ObligationReminderInput {
  reminderEnabled?: boolean;
  reminderFrequency?: ReminderFrequency;
  reminderDayOfWeek?: number;
  reminderDayOfMonth?: number;
  reminderMonth?: number;
  /** ISO UTC instant; required for a single installment with a reminder. */
  reminderAt?: string;
  reminderHour?: number;
}

/** Body accepted by `POST /collections` (never includes `userId`). */
export interface CollectionInput extends ObligationReminderInput {
  personName: string;
  totalAmount: number;
  installmentsCount: number;
  description?: string;
}

export type CollectionUpdateInput = Partial<CollectionInput>;

/** Body accepted by `POST /loans` (never includes `userId`). */
export interface LoanInput extends ObligationReminderInput {
  accountId: string;
  personName: string;
  totalAmount: number;
  installmentsCount: number;
  description?: string;
}

export type LoanUpdateInput = Partial<LoanInput>;

/** Body accepted by `POST /debts` (never includes `userId`). */
export interface DebtInput extends ObligationReminderInput {
  personName: string;
  totalAmount: number;
  installmentsCount: number;
}

export type DebtUpdateInput = Partial<DebtInput>;

/** Body accepted by the `.../pay` endpoints (never includes `userId`). */
export interface PayInstallmentInput {
  accountId: string;
  name?: string;
  description?: string;
}

export interface CollectionPaymentResult {
  installment: ObligationInstallment;
  collectionStatus: ObligationStatus;
}

export interface LoanPaymentResult {
  installment: ObligationInstallment;
  loanStatus: ObligationStatus;
}

export interface DebtPaymentResult {
  installment: ObligationInstallment;
  debtStatus: ObligationStatus;
}

/* ------------------------------- Collections ------------------------------ */

/** GET /collections — collections with `paidAmount` and `pendingAmount`. */
export async function getCollections(status?: ObligationStatus): Promise<Collection[]> {
  const { data } = await api.get<ApiEnvelope<Collection[]>>('/collections', { params: { status } });
  return data.data;
}

/** GET /collections/:id — collection with its `installments`. */
export async function getCollection(id: string): Promise<Collection> {
  const { data } = await api.get<ApiEnvelope<Collection>>(`/collections/${id}`);
  return data.data;
}

/** POST /collections — registers a collection. */
export async function createCollection(input: CollectionInput): Promise<Collection> {
  const { data } = await api.post<ApiEnvelope<Collection>>('/collections', input);
  return data.data;
}

/** PATCH /collections/:id — updates the allowed subset of fields. */
export async function updateCollection(
  id: string,
  input: CollectionUpdateInput,
): Promise<Collection> {
  const { data } = await api.patch<ApiEnvelope<Collection>>(`/collections/${id}`, input);
  return data.data;
}

/** DELETE /collections/:id — keeps the incomes already generated. */
export async function deleteCollection(id: string): Promise<void> {
  await api.delete<ApiEnvelope<null>>(`/collections/${id}`);
}

/** POST /collections/:id/installments/:installmentId/pay — creates the income. */
export async function payCollectionInstallment(
  id: string,
  installmentId: string,
  input: PayInstallmentInput,
): Promise<CollectionPaymentResult> {
  const { data } = await api.post<ApiEnvelope<CollectionPaymentResult>>(
    `/collections/${id}/installments/${installmentId}/pay`,
    input,
  );
  return data.data;
}

/* --------------------------------- Loans ---------------------------------- */

/** GET /loans — loans with `paidAmount` and `pendingAmount`. */
export async function getLoans(status?: ObligationStatus): Promise<Loan[]> {
  const { data } = await api.get<ApiEnvelope<Loan[]>>('/loans', { params: { status } });
  return data.data;
}

/** GET /loans/:id — loan with its `installments`. */
export async function getLoan(id: string): Promise<Loan> {
  const { data } = await api.get<ApiEnvelope<Loan>>(`/loans/${id}`);
  return data.data;
}

/** POST /loans — registers a loan (generates a CORRIENTE expense). */
export async function createLoan(input: LoanInput): Promise<Loan> {
  const { data } = await api.post<ApiEnvelope<Loan>>('/loans', input);
  return data.data;
}

/** PATCH /loans/:id — updates the allowed subset of fields. */
export async function updateLoan(id: string, input: LoanUpdateInput): Promise<Loan> {
  const { data } = await api.patch<ApiEnvelope<Loan>>(`/loans/${id}`, input);
  return data.data;
}

/** DELETE /loans/:id — keeps the creation expense and the incomes. */
export async function deleteLoan(id: string): Promise<void> {
  await api.delete<ApiEnvelope<null>>(`/loans/${id}`);
}

/** POST /loans/:id/installments/:installmentId/pay — creates the income. */
export async function payLoanInstallment(
  id: string,
  installmentId: string,
  input: PayInstallmentInput,
): Promise<LoanPaymentResult> {
  const { data } = await api.post<ApiEnvelope<LoanPaymentResult>>(
    `/loans/${id}/installments/${installmentId}/pay`,
    input,
  );
  return data.data;
}

/* --------------------------------- Debts ---------------------------------- */

/** GET /debts — debts with `paidAmount` and `pendingAmount`. */
export async function getDebts(status?: ObligationStatus): Promise<Debt[]> {
  const { data } = await api.get<ApiEnvelope<Debt[]>>('/debts', { params: { status } });
  return data.data;
}

/** GET /debts/:id — debt with its `installments`. */
export async function getDebt(id: string): Promise<Debt> {
  const { data } = await api.get<ApiEnvelope<Debt>>(`/debts/${id}`);
  return data.data;
}

/** POST /debts — registers a debt (generates no movement). */
export async function createDebt(input: DebtInput): Promise<Debt> {
  const { data } = await api.post<ApiEnvelope<Debt>>('/debts', input);
  return data.data;
}

/** PATCH /debts/:id — updates the allowed subset of fields. */
export async function updateDebt(id: string, input: DebtUpdateInput): Promise<Debt> {
  const { data } = await api.patch<ApiEnvelope<Debt>>(`/debts/${id}`, input);
  return data.data;
}

/** DELETE /debts/:id — keeps the expenses already generated. */
export async function deleteDebt(id: string): Promise<void> {
  await api.delete<ApiEnvelope<null>>(`/debts/${id}`);
}

/** POST /debts/:id/installments/:installmentId/pay — creates the expense. */
export async function payDebtInstallment(
  id: string,
  installmentId: string,
  input: PayInstallmentInput,
): Promise<DebtPaymentResult> {
  const { data } = await api.post<ApiEnvelope<DebtPaymentResult>>(
    `/debts/${id}/installments/${installmentId}/pay`,
    input,
  );
  return data.data;
}
