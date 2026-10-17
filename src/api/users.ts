import { api, type ApiEnvelope } from './client';

/** `GET /users/me` payload (no `passwordHash`). */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  timezone: string;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
}

/** GET /users/me — current user profile. */
export async function getMe(): Promise<UserProfile> {
  const { data } = await api.get<ApiEnvelope<UserProfile>>('/users/me');
  return data.data;
}
