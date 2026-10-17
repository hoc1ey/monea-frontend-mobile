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

/** Body accepted by `POST /accounts` (never includes `userId`). */
export interface AccountInput {
  name: string;
  financialInstitution: string;
  color: string;
  initialBalance: number;
  description?: string;
}

export type AccountUpdateInput = Partial<AccountInput>;

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

/** POST /accounts — creates an account and returns it. */
export async function createAccount(input: AccountInput): Promise<Account> {
  const { data } = await api.post<ApiEnvelope<Account>>('/accounts', input);
  return data.data;
}

/**
 * PATCH /accounts/:id — updates a subset of the creation fields. The API
 * `message` warns the user when the initial balance (and thus the derived
 * current balance) changed, so it is returned for the toast.
 */
export async function updateAccount(
  id: string,
  input: AccountUpdateInput,
): Promise<{ account: Account; message: string }> {
  const { data } = await api.patch<ApiEnvelope<Account>>(`/accounts/${id}`, input);
  return { account: data.data, message: data.message };
}

/** DELETE /accounts/:id — logical delete; the account's movements are kept. */
export async function deleteAccount(id: string): Promise<void> {
  await api.delete<ApiEnvelope<null>>(`/accounts/${id}`);
}
