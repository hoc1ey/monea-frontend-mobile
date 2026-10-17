import axios, { type AxiosError } from 'axios';

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
}

export const api = axios.create({
  baseURL: env?.API_URL ?? '',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<Partial<ApiEnvelope<unknown>>>) => {
    const envelope = error.response?.data;

    const apiError: ApiError = {
      status: error.response?.status ?? 0,
      message: envelope?.message ?? error.message ?? 'Error inesperado',
      errors: envelope?.errors,
    };

    return Promise.reject(apiError);
  },
);
