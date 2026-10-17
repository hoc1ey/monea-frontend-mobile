import { api, type ApiEnvelope } from './client';

export interface CreditCard {
  id: string;
  userId: string;
  name: string;
  color: string;
  issuer: string;
  lastFourDigits: string;
  creditLimit: number | null;
  cutoffDay: number | null;
  paymentDay: number | null;
  reminderEnabled: boolean;
  reminderDaysBefore: number;
  reminderHour: number;
}

/** `GET /credit-cards/:id/debt` payload. */
export interface CreditCardDebt {
  /** Unpaid installments with period ≤ current month. */
  currentDebt: number;
  /** Installments scheduled for future periods. */
  upcoming: number;
  totalPending: number;
  creditLimit: number;
  availableCredit: number;
}

export interface CreditCardReportItem {
  name: string;
  installmentNumber: number;
  installmentsTotal: number;
  amount: number;
}

/** `GET /credit-cards/:id/report?period=YYYY-MM` payload. */
export interface CreditCardReport {
  period: string;
  total: number;
  paid: boolean;
  paidAt: string | null;
  cutoffDate: string;
  paymentDate: string;
  items: CreditCardReportItem[];
}

/** Body accepted by `POST /credit-cards` (never includes `userId`). */
export interface CreditCardInput {
  name: string;
  color: string;
  issuer: string;
  lastFourDigits: string;
  creditLimit?: number;
  cutoffDay?: number;
  paymentDay?: number;
  reminderEnabled?: boolean;
  reminderDaysBefore?: number;
  reminderHour?: number;
}

export type CreditCardUpdateInput = Partial<CreditCardInput>;

/** Body accepted by `POST /credit-cards/:id/pay`. */
export interface CreditCardPayInput {
  accountId: string;
  period?: string;
}

/** `CreditCardPayment` returned by `POST /credit-cards/:id/pay`. */
export interface CreditCardPayment {
  id: string;
  userId: string;
  creditCardId: string;
  accountId: string;
  expenseId: string;
  period: string;
  amount: number;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
}

/** GET /credit-cards — cards ordered by `createdAt` DESC. */
export async function getCreditCards(): Promise<CreditCard[]> {
  const { data } = await api.get<ApiEnvelope<CreditCard[]>>('/credit-cards');
  return data.data;
}

/** GET /credit-cards/:id — single card. 404 if missing or not owned. */
export async function getCreditCard(id: string): Promise<CreditCard> {
  const { data } = await api.get<ApiEnvelope<CreditCard>>(`/credit-cards/${id}`);
  return data.data;
}

/** POST /credit-cards — creates a card and returns it. */
export async function createCreditCard(input: CreditCardInput): Promise<CreditCard> {
  const { data } = await api.post<ApiEnvelope<CreditCard>>('/credit-cards', input);
  return data.data;
}

/** PATCH /credit-cards/:id — updates a subset of the creation fields. */
export async function updateCreditCard(
  id: string,
  input: CreditCardUpdateInput,
): Promise<CreditCard> {
  const { data } = await api.patch<ApiEnvelope<CreditCard>>(`/credit-cards/${id}`, input);
  return data.data;
}

/** DELETE /credit-cards/:id — logical delete; deferred expenses are kept. */
export async function deleteCreditCard(id: string): Promise<void> {
  await api.delete<ApiEnvelope<null>>(`/credit-cards/${id}`);
}

/** GET /credit-cards/:id/debt — current debt and available credit. */
export async function getCreditCardDebt(id: string): Promise<CreditCardDebt> {
  const { data } = await api.get<ApiEnvelope<CreditCardDebt>>(`/credit-cards/${id}/debt`);
  return data.data;
}

/** GET /credit-cards/:id/report — monthly statement for `period` (`YYYY-MM`). */
export async function getCreditCardReport(id: string, period: string): Promise<CreditCardReport> {
  const { data } = await api.get<ApiEnvelope<CreditCardReport>>(`/credit-cards/${id}/report`, {
    params: { period },
  });
  return data.data;
}

/**
 * POST /credit-cards/:id/pay — pays a period and generates a CORRIENTE expense
 * from `accountId` (source `CARD_PAYMENT`). 409 if the period was already paid.
 */
export async function payCreditCardPeriod(
  id: string,
  input: CreditCardPayInput,
): Promise<CreditCardPayment> {
  const { data } = await api.post<ApiEnvelope<CreditCardPayment>>(
    `/credit-cards/${id}/pay`,
    input,
  );
  return data.data;
}
