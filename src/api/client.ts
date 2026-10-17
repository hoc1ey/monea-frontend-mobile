import axios, { type AxiosError } from 'axios';

import { getAccessToken } from '@/auth/tokens';
import { env } from '@/config/env';

export interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  data: T;
  message: string;
  errors?: unknown;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: unknown;
  data?: unknown;
}

export const api = axios.create({
  baseURL: env?.API_URL ?? '',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/health'];

function isPublicRequest(url?: string): boolean {
  return url ? PUBLIC_PATHS.some((path) => url.includes(path)) : false;
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

api.interceptors.request.use((config) => {
  if (!isPublicRequest(config.url)) {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<Partial<ApiEnvelope<unknown>>>) => {
    const envelope = error.response?.data;
    const apiError: ApiError = {
      status: error.response?.status ?? 0,
      message: envelope?.message ?? error.message ?? 'Error inesperado',
      errors: envelope?.errors,
      data: envelope?.data,
    };

    return Promise.reject(apiError);
  },
);
