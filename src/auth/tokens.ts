import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'monea.access';
const REFRESH_KEY = 'monea.refresh';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

let cache: TokenPair | null = null;

/**
 * Reads the token pair from the secure store. Tokens never live in AsyncStorage
 * (CONVENCIONES 1.5 / F03); the first read populates the in-memory cache.
 */
export async function loadTokens(): Promise<TokenPair | null> {
  if (cache) {
    return cache;
  }

  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);

  if (!accessToken || !refreshToken) {
    return null;
  }

  cache = { accessToken, refreshToken };
  return cache;
}

/** In-memory access token used by the HTTP interceptor (synchronous access). */
export function getAccessToken(): string | null {
  return cache?.accessToken ?? null;
}

export function getRefreshToken(): string | null {
  return cache?.refreshToken ?? null;
}

/** Persists the pair in the secure store and refreshes the in-memory cache. */
export async function saveTokens(tokens: TokenPair): Promise<void> {
  cache = { ...tokens };
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken),
  ]);
}

/** Removes the tokens from the secure store and the in-memory cache. */
export async function clearTokens(): Promise<void> {
  cache = null;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}
