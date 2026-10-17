import { api, type ApiEnvelope } from './client';
import type { Paginated } from './types';

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

/** GET /incomes — paginated incomes ordered by `date` DESC. */
export async function getIncomes(params: IncomeQuery = {}): Promise<Paginated<Income>> {
  const { data } = await api.get<ApiEnvelope<Paginated<Income>>>('/incomes', { params });
  return data.data;
}
