/**
 * Normalized error shape produced by the axios interceptor in `client.ts`.
 * Lives in its own module so `queryClient.ts` can consume it without a
 * circular import with the HTTP client.
 */
export interface ApiError {
  status: number;
  message: string;
  errors?: unknown;
  data?: unknown;
}

export function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'status' in error && 'message' in error;
}

/** Reads `retryAfterMinutes` from a 423/429 login error (F03 lock screen). */
export function getRetryAfterMinutes(error: unknown): number | null {
  if (!isApiError(error)) {
    return null;
  }

  const data = error.data as { retryAfterMinutes?: unknown } | undefined;
  const errors = error.errors as { retryAfterMinutes?: unknown } | undefined;
  const value = data?.retryAfterMinutes ?? errors?.retryAfterMinutes;

  return typeof value === 'number' ? value : null;
}

/**
 * User-facing message for a failed request (F16). Keeps the API `message` for
 * business errors (400/404/409/423) and replaces technical strings — network
 * failures and 5xx — with copy the user can act on. Never leaks JSON or
 * transport details.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (!isApiError(error)) {
    return fallback;
  }

  if (error.status === 429) {
    const minutes = getRetryAfterMinutes(error);
    return minutes
      ? `Demasiadas solicitudes. Intenta de nuevo en ${minutes} min.`
      : 'Demasiadas solicitudes. Intenta en un momento.';
  }

  if (error.status === 0) {
    return 'Sin conexión. Revisa tu conexión e intenta de nuevo.';
  }

  if (error.status >= 500) {
    return 'No se pudo completar la operación. Intenta de nuevo.';
  }

  return error.message || fallback;
}

/**
 * Default retry policy for TanStack Query: retry transient failures (network,
 * throttling, server errors) up to twice; never retry 4xx because a rejected
 * request would fail again (404 also drives "no encontrado" screens).
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) {
    return false;
  }

  if (!isApiError(error)) {
    return true;
  }

  return error.status === 0 || error.status === 429 || error.status >= 500;
}
