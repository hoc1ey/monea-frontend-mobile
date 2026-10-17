import { api, type ApiEnvelope } from './client';

/** Bank account as returned by the API, with the derived `currentBalance`. */
export interface Account {
  id: string;
  userId: string;
  name: string;
  financialInstitution: string;
  color: string;
  initialBalance: number;
  currentBalance: number;
  description: string | null;
}

/** GET /accounts — accounts ordered by `createdAt` DESC. */
export async function getAccounts(): Promise<Account[]> {
  const { data } = await api.get<ApiEnvelope<Account[]>>('/accounts');
  return data.data;
}

/** GET /accounts/:id — single account with its `currentBalance`. 404 if missing. */
export async function getAccount(id: string): Promise<Account> {
  const { data } = await api.get<ApiEnvelope<Account>>(`/accounts/${id}`);
  return data.data;
}
