import { api } from './client';

/** The backend only accepts Android devices (F04). */
export type DevicePlatform = 'ANDROID';

export interface DeviceRegistrationInput {
  token: string;
  platform: DevicePlatform;
}

/** POST /notifications/devices — associates the FCM token with the user. */
export async function registerDevice(input: DeviceRegistrationInput): Promise<void> {
  await api.post('/notifications/devices', input);
}

/** DELETE /notifications/devices/:token — deactivates the device on logout. */
export async function unregisterDevice(token: string): Promise<void> {
  await api.delete(`/notifications/devices/${encodeURIComponent(token)}`);
}
