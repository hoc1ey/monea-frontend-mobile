import { isApiError } from '@/api/client';

/**
 * Retry policy for obligation queries: a 404 means the record is gone, so stop
 * retrying and let the "no encontrado" flow react immediately.
 */
export function retryObligation(failureCount: number, error: unknown): boolean {
  return failureCount < 2 && !(isApiError(error) && error.status === 404);
}
