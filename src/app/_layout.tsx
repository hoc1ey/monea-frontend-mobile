import '@/global.css';

import { useEffect, useMemo } from 'react';

import * as SystemUI from 'expo-system-ui';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, vars } from 'nativewind';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/api/queryClient';
import { ConfigError } from '@/components/ConfigError';
import { QuickActionsSheet } from '@/components/navigation/QuickActionsSheet';
import { NotificationObserver } from '@/components/notifications/NotificationObserver';
import { ConfirmProvider, ToastProvider } from '@/components/ui';
import { envError } from '@/config/env';
import {
  addDeviceTokenRotationListener,
  configureNotificationChannel,
  configureNotificationHandler,
  registerDeviceToken,
} from '@/lib/notifications';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import { darkTheme, lightTheme } from '@/theme/tokens';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = vars(isDark ? darkTheme : lightTheme);
  const backgroundColor = isDark ? darkTheme['--color-bg'] : lightTheme['--color-bg'];
  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return { ...base, colors: { ...base.colors, background: backgroundColor } };
  }, [isDark, backgroundColor]);
  const status = useAuthStore((state) => state.status);
  const hydrateTheme = useThemeStore((state) => state.hydrate);

  useEffect(() => {
    configureNotificationHandler();
    void configureNotificationChannel();
  }, []);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(backgroundColor);
  }, [backgroundColor]);

  useEffect(() => {
    void hydrateTheme();
  }, [hydrateTheme]);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    void registerDeviceToken();
    const subscription = addDeviceTokenRotationListener();
    return () => subscription.remove();
  }, [status]);

  return (
    <GestureHandlerRootView style={[{ flex: 1 }, theme]}>
      <SafeAreaProvider>
        <ThemeProvider value={navigationTheme}>
          {envError ? (
            <ConfigError message={envError} />
          ) : (
            <QueryClientProvider client={queryClient}>
              <BottomSheetModalProvider>
                <ConfirmProvider>
                  <ToastProvider>
                    <StatusBar style="auto" />
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        animation: 'slide_from_right',
                        cardStyle: { backgroundColor },
                      }}
                    >
                      <Stack.Protected guard={status !== 'authenticated'}>
                        <Stack.Screen name="(auth)" />
                      </Stack.Protected>
                      <Stack.Protected guard={status === 'authenticated'}>
                        <Stack.Screen name="(tabs)" options={{ animation: 'fade', freezeOnBlur: false }} />
                      </Stack.Protected>
                    </Stack>
                    <QuickActionsSheet />
                    <NotificationObserver />
                  </ToastProvider>
                </ConfirmProvider>
              </BottomSheetModalProvider>
            </QueryClientProvider>
          )}
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
