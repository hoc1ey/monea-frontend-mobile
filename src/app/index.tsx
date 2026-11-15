import { Redirect } from 'expo-router';

import { useAuthStore } from '@/stores/auth';

/**
 * Root route (`/`). It guarantees the initial URL always matches a registered
 * screen: on a cold start the root Stack only registers `(auth)` while the
 * session resolves, so without this screen the APK shows the "Unmatched route"
 * error before the splash can bootstrap the session.
 */
export default function IndexRedirect() {
  const status = useAuthStore((state) => state.status);

  if (status === 'authenticated') {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/splash" />;
}
