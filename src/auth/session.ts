import {
  login as loginRequest,
  logout as logoutRequest,
  logoutAll as logoutAllRequest,
  refresh as refreshRequest,
  register as registerRequest,
  verifyEmail as verifyEmailRequest,
  type AuthSession,
  type AuthUser,
  type LoginInput,
  type RegisterInput,
  type RegisterResult,
  type VerifyEmailInput,
} from '@/api/auth';
import { queryClient } from '@/api/queryClient';
import { unregisterDeviceToken } from '@/lib/notifications';
import { useAuthStore } from '@/stores/auth';

import {
  clearMustChangePasswordFlag,
  forgetTempPassword,
  loadMustChangePasswordFlag,
  rememberTempPassword,
  saveMustChangePasswordFlag,
} from './passwordGate';
import { clearTokens, getRefreshToken, loadTokens, saveTokens } from './tokens';

/**
 * Persists an issued session (tokens + user) and marks the store as
 * authenticated. Returns the user so the caller can route to the mandatory
 * password change when `mustChangePassword` is `true` (EMAIL-VERIFY 4.3/7).
 */
async function openSession(session: AuthSession): Promise<AuthUser> {
  await saveTokens({ accessToken: session.accessToken, refreshToken: session.refreshToken });

  const mustChangePassword = session.user.mustChangePassword === true;
  await saveMustChangePasswordFlag(mustChangePassword);

  const { setUser, setStatus, setMustChangePassword } = useAuthStore.getState();
  setUser(session.user);
  setMustChangePassword(mustChangePassword);
  setStatus('authenticated');
  return session.user;
}

/**
 * Restores the session on cold start: reads the tokens from the secure store
 * and validates the refresh token. Returns whether a session is active.
 */
export async function restoreSession(): Promise<boolean> {
  const { setUser, setStatus, setMustChangePassword } = useAuthStore.getState();

  try {
    const tokens = await loadTokens();

    if (!tokens?.refreshToken) {
      setMustChangePassword(false);
      setStatus('unauthenticated');
      return false;
    }

    const refreshed = await refreshRequest(tokens.refreshToken);
    await saveTokens({
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken || tokens.refreshToken,
    });
    setMustChangePassword(await loadMustChangePasswordFlag());
    setStatus('authenticated');
    return true;
  } catch {
    await clearTokens().catch(() => undefined);
    await clearMustChangePasswordFlag();
    setUser(null);
    setMustChangePassword(false);
    setStatus('unauthenticated');
    return false;
  }
}

/**
 * Result of `POST /auth/login` (EMAIL-VERIFY 4): either an authenticated
 * session (whose user may require a password change) or an "email unverified"
 * signal with no tokens that must route to the verification screen.
 */
export type SignInResult =
  | { kind: 'authenticated'; user: AuthUser }
  | { kind: 'unverified'; email: string };

/**
 * Login: valid credentials may return tokens or an unverified-email signal.
 * With tokens the session opens and the password the user just typed is kept
 * in memory only when the API flags a mandatory password change.
 */
export async function signIn(input: LoginInput): Promise<SignInResult> {
  const session = await loginRequest(input);

  if ('accessToken' in session) {
    const user = await openSession(session);

    if (user.mustChangePassword === true) {
      rememberTempPassword(input.password);
    } else {
      forgetTempPassword();
    }

    return { kind: 'authenticated', user };
  }

  forgetTempPassword();
  return { kind: 'unverified', email: session.email };
}

/**
 * Email verification (EMAIL-VERIFY 3.2): the API issues the tokens on success,
 * so the session opens here without going through the login screen again.
 */
export async function completeEmailVerification(input: VerifyEmailInput): Promise<AuthUser> {
  const session = await verifyEmailRequest(input);
  forgetTempPassword();
  return openSession(session);
}

/**
 * Register: the API no longer returns tokens. The account waits for the email
 * verification code before the user signs in (EMAILS 3.1).
 */
export async function signUp(input: RegisterInput): Promise<RegisterResult> {
  return registerRequest(input);
}

/** Logout: revokes the current session and clears all local state. */
export async function signOut(): Promise<void> {
  const refreshToken = getRefreshToken();
  await unregisterDeviceToken();
  await clearTokens();
  await clearMustChangePasswordFlag();
  queryClient.clear();
  const { setUser, setStatus, setMustChangePassword } = useAuthStore.getState();
  setUser(null);
  setMustChangePassword(false);
  setStatus('unauthenticated');

  if (refreshToken) {
    logoutRequest(refreshToken).catch(() => undefined);
  }
}

/** Logout-all: revokes every session of the user and clears all local state. */
export async function signOutAll(): Promise<void> {
  await unregisterDeviceToken();
  await logoutAllRequest().catch(() => undefined);
  await clearTokens();
  await clearMustChangePasswordFlag();
  queryClient.clear();
  const { setUser, setStatus, setMustChangePassword } = useAuthStore.getState();
  setUser(null);
  setMustChangePassword(false);
  setStatus('unauthenticated');
}

/**
 * Clears every piece of local session state without calling the API. Used after
 * the backend already revoked all sessions (e.g. a password change).
 */
export async function clearSession(): Promise<void> {
  await clearTokens();
  await clearMustChangePasswordFlag();
  queryClient.clear();
  const { setUser, setStatus, setMustChangePassword } = useAuthStore.getState();
  setUser(null);
  setMustChangePassword(false);
  setStatus('unauthenticated');
}
