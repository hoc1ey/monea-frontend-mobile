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

/** Body accepted by `PATCH /users/me` (never includes `userId`). */
export interface UpdateProfileInput {
  name?: string;
  timezone?: string;
}

/** GET /users/me — current user profile. */
export async function getMe(): Promise<UserProfile> {
  const { data } = await api.get<ApiEnvelope<UserProfile>>('/users/me');
  return data.data;
}

/** PATCH /users/me — updates the profile name and/or IANA timezone. */
export async function updateMe(input: UpdateProfileInput): Promise<UserProfile> {
  const { data } = await api.patch<ApiEnvelope<UserProfile>>('/users/me', input);
  return data.data;
}
