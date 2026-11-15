import type { ExpoConfig } from 'expo/config';

const { existsSync } = require('fs') as { existsSync: (path: string) => boolean };
const { config: loadEnv } = require('dotenv') as { config: (options?: unknown) => void };

/**
 * Loads `.env` explicitly so the values below are available even when this
 * config is evaluated outside the Expo CLI (e.g. `eas update` publish steps
 * or CI shells that do not preload dotenv).
 */
loadEnv();

/**
 * `google-services.json` is required by FCM (F04) but is gitignored and only
 * present in push-capable builds. Declaring it unconditionally makes Expo fail
 * to parse the config on machines without the file, so it is added only when it
 * actually exists.
 */
const googleServicesFile = './google-services.json';
const hasGoogleServicesFile = existsSync(googleServicesFile);

/**
 * Runtime environment values. They are published inside `extra`, and the app
 * reads them from `Constants.expoConfig` (src/config/env.ts). Because an EAS
 * Update embeds the app config of the publish run, an OTA update can deliver
 * new values without a new store build.
 */
const envExtra: Record<string, string> = {};
if (process.env.EXPO_PUBLIC_API_URL) {
  envExtra.EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL;
}
if (process.env.EXPO_PUBLIC_APP_ENV) {
  envExtra.EXPO_PUBLIC_APP_ENV = process.env.EXPO_PUBLIC_APP_ENV;
}

const config: ExpoConfig = {
  name: 'Monea',
  slug: 'monea',
  scheme: 'monea',
  version: '1.1.0',
  runtimeVersion: { policy: 'appVersion' },
  updates: {
    url: 'https://u.expo.dev/5587977e-c43b-4042-9b9b-65a7d755d120',
  },
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/images/icon.png',
  ios: {
    icon: './assets/expo.icon',
  },
  android: {
    package: 'com.monea.app',
    versionCode: 1,
    ...(hasGoogleServicesFile ? { googleServicesFile } : {}),
    adaptiveIcon: {
      backgroundColor: '#8F0C5B',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        backgroundColor: '#F8C8DC',
        dark: {
          backgroundColor: '#1A1A1A',
        },
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/android-icon-notifications.png',
        color: '#EF13A1',
      },
    ],
    '@react-native-community/datetimepicker',
  ],
  extra: {
    eas: {
      projectId: '5587977e-c43b-4042-9b9b-65a7d755d120',
    },
    ...(Object.keys(envExtra).length > 0 ? { env: envExtra } : {}),
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
