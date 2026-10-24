import { api, type ApiEnvelope } from './client';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  timezone?: string;
  emailVerified?: boolean;
  mustChangePassword?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthSession extends AuthTokens {
  user: AuthUser;
}

/**
 * `POST /auth/login` returns one of two `200` shapes (EMAIL-VERIFY 4.1/4.2):
 * a full session (tokens + user, possibly with `mustChangePassword`) or a
 * `emailVerified: false` signal with no tokens.
 */
export type LoginResponse =
  | AuthSession
  | {
      email: string;
      emailVerified: false;
    };

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

/** `POST /auth/register` no longer returns tokens (EMAILS 3.1). */
export interface RegisterResult {
  email: string;
  registered: boolean;
}

export interface VerifyEmailInput {
  email: string;
  code: string;
}

export interface ActionResult {
  sent?: boolean;
  /** User-facing message from the API envelope. */
  message: string;
}

/**
 * POST /auth/login — 401/423/429 are surfaced as `ApiError` by the client.
 * With valid credentials it may still return no tokens (email unverified),
 * so the caller must discriminate on the result shape.
 */
export async function login(input: LoginInput): Promise<LoginResponse> {
  const { data } = await api.post<ApiEnvelope<LoginResponse>>('/auth/login', input);
  return data.data;
}

/** POST /auth/register — creates the account and sends the verification code. */
export async function register(input: RegisterInput): Promise<RegisterResult> {
  const { data } = await api.post<ApiEnvelope<RegisterResult>>('/auth/register', input);
  return data.data;
}

/**
 * POST /auth/verify — confirms the 6-digit code issued after register. On
 * success the API returns the session tokens (EMAIL-VERIFY 3.2), so the caller
 * can sign in immediately without going back to the login screen.
 */
export async function verifyEmail(input: VerifyEmailInput): Promise<AuthSession> {
  const { data } = await api.post<ApiEnvelope<AuthSession>>('/auth/verify', input);
  return data.data;
}

/** POST /auth/resend-verification — the response is generic by design. */
export async function resendVerification(email: string): Promise<ActionResult> {
  const { data } = await api.post<ApiEnvelope<{ sent: boolean }>>('/auth/resend-verification', {
    email,
  });
  return { sent: data.data.sent, message: data.message };
}

/** POST /auth/forgot-password — sends a temporary password when the email exists. */
export async function forgotPassword(email: string): Promise<ActionResult> {
  const { data } = await api.post<ApiEnvelope<{ sent: boolean }>>('/auth/forgot-password', {
    email,
  });
  return { sent: data.data.sent, message: data.message };
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
