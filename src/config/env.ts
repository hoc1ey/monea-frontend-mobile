import { z } from 'zod';

export type AppEnvironment = 'development' | 'staging' | 'production';

export interface Env {
  API_URL: string;
  APP_ENV: AppEnvironment;
}

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url(),
  EXPO_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
});

const result = envSchema.safeParse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
});

export const env: Env | null = result.success
  ? {
      API_URL: result.data.EXPO_PUBLIC_API_URL,
      APP_ENV: result.data.EXPO_PUBLIC_APP_ENV,
    }
  : null;

export const envError: string | null = result.success
  ? null
  : result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
