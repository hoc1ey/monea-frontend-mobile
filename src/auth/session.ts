import {
  login as loginRequest,
  logout as logoutRequest,
  logoutAll as logoutAllRequest,
  refresh as refreshRequest,
  register as registerRequest,
  type LoginInput,
  type RegisterInput,
} from '@/api/auth';
import { queryClient } from '@/api/queryClient';
import { useAuthStore } from '@/stores/auth';

import { clearTokens, getRefreshToken, loadTokens, saveTokens } from './tokens';

/**
 * Restores the session on cold start: reads the tokens from the secure store
 * and validates the refresh token. Returns whether a session is active.
 */
export async function restoreSession(): Promise<boolean> {
  const { setUser, setStatus } = useAuthStore.getState();

  try {
    const tokens = await loadTokens();

    if (!tokens?.refreshToken) {
      setStatus('unauthenticated');
      return false;
    }

    const refreshed = await refreshRequest(tokens.refreshToken);
    await saveTokens({
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken || tokens.refreshToken,
    });
    setStatus('authenticated');
    return true;
  } catch {
    await clearTokens().catch(() => undefined);
    setUser(null);
    setStatus('unauthenticated');
    return false;
  }
}

/** Login: persists the tokens and marks the session as authenticated. */
export async function signIn(input: LoginInput): Promise<void> {
  const session = await loginRequest(input);
  await saveTokens({ accessToken: session.accessToken, refreshToken: session.refreshToken });
  const { setUser, setStatus } = useAuthStore.getState();
  setUser(session.user);
  setStatus('authenticated');
}

/** Register: persists the tokens and enters the app (F04 handles push permissions). */
export async function signUp(input: RegisterInput): Promise<void> {
  const session = await registerRequest(input);
  await saveTokens({ accessToken: session.accessToken, refreshToken: session.refreshToken });
  const { setUser, setStatus } = useAuthStore.getState();
  setUser(session.user);
  setStatus('authenticated');
}

/** Logout: revokes the current session and clears all local state. */
export async function signOut(): Promise<void> {
  const refreshToken = getRefreshToken();
  await clearTokens();
  queryClient.clear();
  const { setUser, setStatus } = useAuthStore.getState();
  setUser(null);
  setStatus('unauthenticated');

  if (refreshToken) {
    logoutRequest(refreshToken).catch(() => undefined);
  }
}

/** Logout-all: revokes every session of the user and clears all local state. */
export async function signOutAll(): Promise<void> {
  await logoutAllRequest().catch(() => undefined);
  await clearTokens();
  queryClient.clear();
  const { setUser, setStatus } = useAuthStore.getState();
  setUser(null);
  setStatus('unauthenticated');
}
