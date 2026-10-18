import { QueryClient } from '@tanstack/react-query';

import { shouldRetry } from './errors';

/**
 * Single shared cache. The auth layer clears it on logout and on an expired
 * session so no stale user data survives a re-login.
 *
 * Retry policy (F16): queries retry transient failures — network, 429 and 5xx —
 * up to twice via `shouldRetry`; mutations never retry so a payment cannot be
 * duplicated by an automatic retry.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
    },
    mutations: {
      retry: false,
    },
  },
});
