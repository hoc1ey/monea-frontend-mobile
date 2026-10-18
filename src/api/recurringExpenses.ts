import { api, type ApiEnvelope } from './client';

export type RecurringFrequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type ReminderOffset = 'SAME_DAY' | 'ONE_DAY_BEFORE';

/** Automatic expense configuration returned by `/recurring-expenses`. */
export interface RecurringExpenseConfig {
  id: string;
  userId: string;
  accountId: string;
  name: string;
  /** `null` when `isVariableAmount` is `true`. */
  amount: number | null;
  isVariableAmount: boolean;
  description: string | null;
  frequency: RecurringFrequency;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  monthOfYear: number | null;
  /** Calendar date `YYYY-MM-DD`. */
  startDate: string;
  /** Calendar date `YYYY-MM-DD`, optional. */
  endDate: string | null;
  isActive: boolean;
  /** ISO UTC instant of the next occurrence. */
  nextRunAt: string | null;
  lastGeneratedAt: string | null;
  reminderEnabled: boolean;
  reminderOffset: ReminderOffset | null;
  reminderHour: number | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Body accepted by `POST /recurring-expenses` (never includes `userId`). */
export interface RecurringExpenseInput {
  accountId: string;
  name: string;
  /** Required unless `isVariableAmount` is `true`; omit when variable. */
  amount?: number;
  isVariableAmount?: boolean;
  description?: string;
  frequency: RecurringFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  monthOfYear?: number;
  /** Calendar date `YYYY-MM-DD`. */
  startDate: string;
  /** Calendar date `YYYY-MM-DD`. */
  endDate?: string;
  reminderEnabled?: boolean;
  reminderOffset?: ReminderOffset;
  reminderHour?: number;
}

export type RecurringExpenseUpdateInput = Partial<RecurringExpenseInput>;

/** GET /recurring-expenses — configurations ordered by `createdAt` DESC. */
export async function getRecurringExpenses(): Promise<RecurringExpenseConfig[]> {
  const { data } = await api.get<ApiEnvelope<RecurringExpenseConfig[]>>('/recurring-expenses');
  return data.data;
}

/** GET /recurring-expenses/:id — single configuration. `404` if missing. */
export async function getRecurringExpense(id: string): Promise<RecurringExpenseConfig> {
  const { data } = await api.get<ApiEnvelope<RecurringExpenseConfig>>(`/recurring-expenses/${id}`);
  return data.data;
}

/** POST /recurring-expenses — creates a configuration. */
export async function createRecurringExpense(
  input: RecurringExpenseInput,
): Promise<RecurringExpenseConfig> {
  const { data } = await api.post<ApiEnvelope<RecurringExpenseConfig>>('/recurring-expenses', input);
  return data.data;
}

/** PATCH /recurring-expenses/:id — updates the configuration without touching generated expenses. */
export async function updateRecurringExpense(
  id: string,
  input: RecurringExpenseUpdateInput,
): Promise<RecurringExpenseConfig> {
  const { data } = await api.patch<ApiEnvelope<RecurringExpenseConfig>>(
    `/recurring-expenses/${id}`,
    input,
  );
  return data.data;
}

/** PATCH /recurring-expenses/:id/active — activates/deactivates without deleting expenses. */
export async function setRecurringExpenseActive(
  id: string,
  isActive: boolean,
): Promise<RecurringExpenseConfig> {
  const { data } = await api.patch<ApiEnvelope<RecurringExpenseConfig>>(
    `/recurring-expenses/${id}/active`,
    { isActive },
  );
  return data.data;
}

/** DELETE /recurring-expenses/:id — keeps the expenses already generated. */
export async function deleteRecurringExpense(id: string): Promise<void> {
  await api.delete<ApiEnvelope<null>>(`/recurring-expenses/${id}`);
}
