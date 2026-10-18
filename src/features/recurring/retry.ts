import { isApiError } from '@/api/client';

/**
 * Retry policy for recurring queries: a 404 means the configuration is gone, so
 * stop retrying and let the "no encontrado" flow react immediately.
 */
export function retryRecurring(failureCount: number, error: unknown): boolean {
  return failureCount < 2 && !(isApiError(error) && error.status === 404);
}
