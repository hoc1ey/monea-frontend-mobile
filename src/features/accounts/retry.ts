import { isApiError } from '@/api/client';

/**
 * Retry policy for account queries: a 404 means the account is gone, so stop
 * retrying to let the "Cuenta no encontrada" flow react immediately.
 */
export function retryAccount(failureCount: number, error: unknown): boolean {
  return failureCount < 2 && !(isApiError(error) && error.status === 404);
}
