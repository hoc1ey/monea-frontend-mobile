import { QueryClient } from '@tanstack/react-query';

/**
 * Single shared cache. The auth layer clears it on logout and on an expired
 * session so no stale user data survives a re-login.
 */
export const queryClient = new QueryClient();
