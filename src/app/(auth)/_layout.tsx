import { Stack } from 'expo-router';

/** The splash screen is the entry point of the auth flow. */
export const unstable_settings = {
  initialRouteName: 'splash',
};

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
