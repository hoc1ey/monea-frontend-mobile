import { api, type ApiEnvelope } from './client';
import type { Paginated } from './types';

export type { Paginated } from './types';

/** Transfer between two own accounts, as returned by the API. */
export interface Transfer {
  id: string;
  userId: string;
  sourceAccountId: string;
  destinationAccountId: string;
  /** Always positive, up to 2 decimals. */
  amount: number;
  description: string | null;
  date: string;
  /** Expense generated in the source account. */
  expenseId: string | null;
  /** Income generated in the destination account. */
  incomeId: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Body accepted by `POST /transfers` (never includes `userId`). */
export interface TransferInput {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  description?: string;
  date?: string;
}

/** Optional filters accepted by `GET /transfers` (only documented fields). */
export interface TransferQuery {
  page?: number;
  limit?: number;
  /** Matches transfers where the account is origin OR destination. */
  accountId?: string;
  from?: string;
  to?: string;
}

/** GET /transfers — paginated transfers ordered by `date` DESC, `createdAt` DESC. */
export async function getTransfers(params: TransferQuery = {}): Promise<Paginated<Transfer>> {
  const { data } = await api.get<ApiEnvelope<Paginated<Transfer>>>('/transfers', { params });
  return data.data;
}

/** GET /transfers/:id — single transfer. 404 if missing, deleted or not owned. */
export async function getTransfer(id: string): Promise<Transfer> {
  const { data } = await api.get<ApiEnvelope<Transfer>>(`/transfers/${id}`);
  return data.data;
}

/** POST /transfers — moves money between two distinct own accounts. */
export async function createTransfer(input: TransferInput): Promise<Transfer> {
  const { data } = await api.post<ApiEnvelope<Transfer>>('/transfers', input);
  return data.data;
}

/**
 * DELETE /transfers/:id — logical delete; the linked expense and income are
 * removed in the same transaction, so both account balances recover.
 */
export async function deleteTransfer(id: string): Promise<void> {
  await api.delete<ApiEnvelope<null>>(`/transfers/${id}`);
}
