import { api, type ApiEnvelope } from './client';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  timezone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthSession extends AuthTokens {
  user: AuthUser;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  timezone?: string;
}

/** POST /auth/login — 401/423/429 are surfaced as `ApiError` by the client. */
export async function login(input: LoginInput): Promise<AuthSession> {
  const { data } = await api.post<ApiEnvelope<AuthSession>>('/auth/login', input);
  return data.data;
}

/** POST /auth/register */
export async function register(input: RegisterInput): Promise<AuthSession> {
  const { data } = await api.post<ApiEnvelope<AuthSession>>('/auth/register', input);
  return data.data;
}

/** POST /auth/refresh — returns a fresh token pair. */
export async function refresh(refreshToken: string): Promise<AuthTokens> {
  const { data } = await api.post<ApiEnvelope<AuthTokens>>('/auth/refresh', { refreshToken });
  return data.data;
}

/** POST /auth/logout — revokes the current session (best effort). */
export async function logout(refreshToken?: string): Promise<void> {
  await api.post('/auth/logout', refreshToken ? { refreshToken } : {});
}

/** POST /auth/logout-all — revokes every session of the user. */
export async function logoutAll(): Promise<void> {
  await api.post('/auth/logout-all');
}
