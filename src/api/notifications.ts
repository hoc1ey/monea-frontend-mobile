import { api, type ApiEnvelope } from './client';

/** The backend only accepts Android devices (F04). */
export type DevicePlatform = 'ANDROID';

export interface DeviceRegistrationInput {
  token: string;
  platform: DevicePlatform;
}

/** Reminder kinds sent by the backend in pushes and in the reminders list. */
export type ReminderType =
  | 'CREDIT_CARD_PAYMENT'
  | 'RECURRING_EXPENSE'
  | 'COLLECTION'
  | 'LOAN'
  | 'DEBT';

export type ReminderStatus = 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';

/**
 * Row returned by `GET /notifications/reminders` (documents the reminder model
 * of the API: `id, userId, type, sourceId, title, body, scheduledAt, status,
 * attempts, sentAt, lastError, isDeleted, createdAt, updatedAt`).
 */
export interface Reminder {
  id: string;
  userId: string;
  type: ReminderType;
  /** Entity id the reminder points at (card, recurring config, installment). */
  sourceId: string;
  title: string;
  body: string | null;
  /** ISO UTC instant of the reminder. */
  scheduledAt: string;
  status: ReminderStatus;
  attempts: number;
  sentAt: string | null;
  lastError: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  /**
   * Not part of the documented model. The prototype shows an amount when the
   * backend includes it, so it is read defensively.
   */
  amount?: number | null;
}

/** POST /notifications/devices — associates the FCM token with the user. */
export async function registerDevice(input: DeviceRegistrationInput): Promise<void> {
  await api.post('/notifications/devices', input);
}

/** DELETE /notifications/devices/:token — deactivates the device on logout. */
export async function unregisterDevice(token: string): Promise<void> {
  await api.delete(`/notifications/devices/${encodeURIComponent(token)}`);
}

/** GET /notifications/reminders — upcoming reminders of the user. */
export async function getReminders(): Promise<Reminder[]> {
  const { data } = await api.get<ApiEnvelope<Reminder[]>>('/notifications/reminders');
  return data.data;
}
