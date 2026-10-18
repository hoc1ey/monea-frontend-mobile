import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';

import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from '@/auth/tokens';
import { env } from '@/config/env';

import type { ApiError } from './errors';
import { queryClient } from './queryClient';

export { getErrorMessage, getRetryAfterMinutes, isApiError, shouldRetry } from './errors';
export type { ApiError } from './errors';

export interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  data: T;
  message: string;
  errors?: unknown;
}

export const api = axios.create({
  baseURL: env?.API_URL ?? '',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Bare client for `/auth/refresh`: never goes through the 401 interceptor, so
 * a failing refresh cannot trigger an infinite refresh loop.
 */
const refreshClient = axios.create({
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

api.interceptors.request.use((config) => {
  if (!isPublicRequest(config.url)) {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/** Single in-flight refresh shared by every request that gets a 401. */
let refreshInFlight: Promise<string> | null = null;

async function requestRefresh(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('missing_refresh_token');
  }

  const response = await refreshClient.post<ApiEnvelope<{ accessToken: string; refreshToken: string }>>(
    '/auth/refresh',
    { refreshToken },
  );

  const tokens = response.data.data;
  const nextRefreshToken = tokens.refreshToken || refreshToken;
  await saveTokens({ accessToken: tokens.accessToken, refreshToken: nextRefreshToken });
  return tokens.accessToken;
}

async function endSession(): Promise<void> {
  await clearTokens();
  queryClient.clear();
  router.replace('/login');
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<Partial<ApiEnvelope<unknown>>>) => {
    const config = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status ?? 0;

    if (status === 401 && config && !config._retry && !isPublicRequest(config.url) && getRefreshToken()) {
      config._retry = true;

      try {
        refreshInFlight = refreshInFlight ?? requestRefresh().finally(() => {
          refreshInFlight = null;
        });
        const accessToken = await refreshInFlight;
        config.headers.Authorization = `Bearer ${accessToken}`;
        return api(config);
      } catch {
        await endSession();
      }
    }

    const envelope = error.response?.data;
    const apiError: ApiError = {
      status,
      message: envelope?.message ?? error.message ?? 'Error inesperado',
      errors: envelope?.errors,
      data: envelope?.data,
    };

    return Promise.reject(apiError);
  },
);
