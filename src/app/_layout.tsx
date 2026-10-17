import '@/global.css';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, vars } from 'nativewind';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ConfigError } from '@/components/ConfigError';
import { envError } from '@/config/env';
import { darkTheme, lightTheme } from '@/theme/tokens';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = vars(isDark ? darkTheme : lightTheme);
  const backgroundColor = isDark ? darkTheme['--color-bg'] : lightTheme['--color-bg'];

  return (
    <GestureHandlerRootView style={[{ flex: 1 }, theme]}>
      <SafeAreaProvider>
        {envError ? (
          <ConfigError message={envError} />
        ) : (
          <QueryClientProvider client={queryClient}>
            <BottomSheetModalProvider>
              <StatusBar style="auto" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor },
                }}
              />
            </BottomSheetModalProvider>
          </QueryClientProvider>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
