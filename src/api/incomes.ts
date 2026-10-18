import { api, type ApiEnvelope } from './client';
import type { Paginated } from './types';

export type { Paginated } from './types';

export type IncomeSourceType = 'MANUAL' | 'COLLECTION_INSTALLMENT' | 'LOAN_INSTALLMENT';

export interface Income {
  id: string;
  userId: string;
  accountId: string;
  name: string;
  amount: number;
  description: string | null;
  date: string;
  sourceType: IncomeSourceType;
  sourceId: string | null;
}

/** Optional filters accepted by `GET /incomes` (only documented fields). */
export interface IncomeQuery {
  page?: number;
  limit?: number;
  accountId?: string;
  from?: string;
  to?: string;
}

/** Body accepted by `POST /incomes` (never includes `userId`). */
export interface IncomeInput {
  accountId: string;
  name: string;
  amount: number;
  description?: string;
  date?: string;
}

/**
 * Body accepted by `PATCH /incomes/:id`. For automatic incomes
 * (`COLLECTION_INSTALLMENT`, `LOAN_INSTALLMENT`) only `name` and `description`
 * are allowed; sending amount/account/date returns 400.
 */
export type IncomeUpdateInput = Partial<IncomeInput>;

/** GET /incomes — paginated incomes ordered by `date` DESC, `createdAt` DESC. */
export async function getIncomes(params: IncomeQuery = {}): Promise<Paginated<Income>> {
  const { data } = await api.get<ApiEnvelope<Paginated<Income>>>('/incomes', { params });
  return data.data;
}

/** GET /incomes/:id — single income. 404 if missing or not owned. */
export async function getIncome(id: string): Promise<Income> {
  const { data } = await api.get<ApiEnvelope<Income>>(`/incomes/${id}`);
  return data.data;
}

/** POST /incomes — registers an income and returns it. */
export async function createIncome(input: IncomeInput): Promise<Income> {
  const { data } = await api.post<ApiEnvelope<Income>>('/incomes', input);
  return data.data;
}

/** PATCH /incomes/:id — updates the allowed subset of fields. */
export async function updateIncome(id: string, input: IncomeUpdateInput): Promise<Income> {
  const { data } = await api.patch<ApiEnvelope<Income>>(`/incomes/${id}`, input);
  return data.data;
}

/** DELETE /incomes/:id — only `MANUAL` incomes; automatic ones return 400. */
export async function deleteIncome(id: string): Promise<void> {
  await api.delete<ApiEnvelope<null>>(`/incomes/${id}`);
}
