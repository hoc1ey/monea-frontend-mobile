import type { ExpoConfig } from 'expo/config';

const { existsSync } = require('fs') as { existsSync: (path: string) => boolean };

/**
 * `google-services.json` is required by FCM (F04) but is gitignored and only
 * present in push-capable builds. Declaring it unconditionally makes Expo fail
 * to parse the config on machines without the file, so it is added only when it
 * actually exists.
 */
const googleServicesFile = './google-services.json';
const hasGoogleServicesFile = existsSync(googleServicesFile);

const config: ExpoConfig = {
  name: 'MONEA',
  slug: 'monea',
  scheme: 'monea',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/images/icon.png',
  ios: {
    icon: './assets/expo.icon',
  },
  android: {
    package: 'com.tuempresa.monea',
    versionCode: 1,
    ...(hasGoogleServicesFile ? { googleServicesFile } : {}),
    adaptiveIcon: {
      backgroundColor: '#8F0C5B',
      foregroundImage: './assets/images/android-icon-foreground.png',
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
        backgroundColor: '#EF13A1',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/android-icon-monochrome.png',
        color: '#EF13A1',
      },
    ],
    '@react-native-community/datetimepicker',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
