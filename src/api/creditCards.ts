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

/** GET /credit-cards — cards ordered by `createdAt` DESC. */
export async function getCreditCards(): Promise<CreditCard[]> {
  const { data } = await api.get<ApiEnvelope<CreditCard[]>>('/credit-cards');
  return data.data;
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
