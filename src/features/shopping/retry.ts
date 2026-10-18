import { isApiError } from '@/api/client';

/**
 * Retry policy for shopping list queries: a 404 means the list is gone, so stop
 * retrying and let the "no encontrada" flow react immediately.
 */
export function retryShoppingList(failureCount: number, error: unknown): boolean {
  return failureCount < 2 && !(isApiError(error) && error.status === 404);
}
