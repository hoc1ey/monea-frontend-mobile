import { isApiError } from '@/api/client';

/**
 * Retry policy for card queries: a 404 means the card is gone, so stop retrying
 * to let the "Tarjeta no encontrada" flow react immediately.
 */
export function retryCard(failureCount: number, error: unknown): boolean {
  return failureCount < 2 && !(isApiError(error) && error.status === 404);
}
