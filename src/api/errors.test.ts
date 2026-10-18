import { getErrorMessage, isApiError, shouldRetry, type ApiError } from './errors';

function apiError(overrides: Partial<ApiError> = {}): ApiError {
  return {
    status: 400,
    message: 'Error de validación',
    ...overrides,
  };
}

describe('getErrorMessage', () => {
  it('returns the fallback for unknown errors', () => {
    expect(getErrorMessage(new Error('boom'), 'No se pudo guardar')).toBe('No se pudo guardar');
    expect(getErrorMessage(null, 'No se pudo guardar')).toBe('No se pudo guardar');
  });

  it('keeps the API message for business errors', () => {
    expect(getErrorMessage(apiError({ status: 409, message: 'Este periodo ya fue pagado' }), 'x')).toBe(
      'Este periodo ya fue pagado',
    );
  });

  it('uses a uniform message for 429', () => {
    expect(getErrorMessage(apiError({ status: 429 }), 'x')).toBe(
      'Demasiadas solicitudes. Intenta en un momento.',
    );
  });

  it('replaces network failures with a friendly message', () => {
    expect(getErrorMessage(apiError({ status: 0, message: 'Network Error' }), 'x')).toBe(
      'Sin conexión. Revisa tu conexión e intenta de nuevo.',
    );
  });

  it('replaces 5xx messages with a friendly message', () => {
    expect(getErrorMessage(apiError({ status: 500, message: 'Internal server error' }), 'x')).toBe(
      'No se pudo completar la operación. Intenta de nuevo.',
    );
  });

  it('falls back when the API message is empty', () => {
    expect(getErrorMessage(apiError({ message: '' }), 'No se pudo guardar')).toBe(
      'No se pudo guardar',
    );
  });
});

describe('shouldRetry', () => {
  it('stops after two retries', () => {
    expect(shouldRetry(0, apiError({ status: 0 }))).toBe(true);
    expect(shouldRetry(1, apiError({ status: 0 }))).toBe(true);
    expect(shouldRetry(2, apiError({ status: 0 }))).toBe(false);
  });

  it('retries transient failures only', () => {
    expect(shouldRetry(0, apiError({ status: 0 }))).toBe(true);
    expect(shouldRetry(0, apiError({ status: 429 }))).toBe(true);
    expect(shouldRetry(0, apiError({ status: 503 }))).toBe(true);
    expect(shouldRetry(0, apiError({ status: 400 }))).toBe(false);
    expect(shouldRetry(0, apiError({ status: 404 }))).toBe(false);
    expect(shouldRetry(0, apiError({ status: 409 }))).toBe(false);
  });

  it('retries unknown errors assuming they are transient', () => {
    expect(shouldRetry(0, new Error('boom'))).toBe(true);
  });
});

describe('isApiError', () => {
  it('detects the normalized error shape', () => {
    expect(isApiError(apiError())).toBe(true);
    expect(isApiError(new Error('boom'))).toBe(false);
    expect(isApiError(undefined)).toBe(false);
  });
});
