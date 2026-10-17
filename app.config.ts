import type { ExpoConfig } from 'expo/config';

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
    [
      'expo-splash-screen',
      {
        backgroundColor: '#EF13A1',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
