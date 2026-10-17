import { Linking, Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

/** Android channel used by every reminder push (F04). */
export const REMINDERS_CHANNEL_ID = 'recordatorios';

/** Accent color (cerise-600) applied to notifications, matches the prototype. */
export const NOTIFICATION_COLOR = '#EF13A1';

/** Device-local flag set when the user picks "Ahora no" in the onboarding. */
const PROMPT_DISMISSED_KEY = 'monea.notifPromptDismissed';

export type NotificationPermission = 'granted' | 'denied' | 'undetermined';

export interface NotificationPermissionResult {
  status: NotificationPermission;
  /** `true` when Android no longer shows the dialog and settings must be used. */
  openSettings: boolean;
}

/**
 * Shows the banner and plays the default sound while the app is in the
 * foreground, so incoming reminders are never silently swallowed.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Creates the high-importance `recordatorios` channel. On Android 13+ the
 * channel must exist before the system permission prompt can be triggered.
 */
export async function configureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(REMINDERS_CHANNEL_ID, {
    name: 'Recordatorios',
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: NOTIFICATION_COLOR,
    sound: 'default',
  });
}

/** Current authorization status, normalized to a plain string. */
export async function getNotificationPermission(): Promise<NotificationPermission> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) {
    return 'granted';
  }
  return settings.status === 'denied' ? 'denied' : 'undetermined';
}

/**
 * Requests permission only after the user tapped the onboarding button (never
 * on mount). When Android will not show the dialog again, `openSettings` is
 * `true` so the caller can send the user to the system settings instead.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionResult> {
  const current = await Notifications.getPermissionsAsync();

  if (current.granted) {
    return { status: 'granted', openSettings: false };
  }

  if (!current.canAskAgain) {
    return { status: 'denied', openSettings: true };
  }

  const requested = await Notifications.requestPermissionsAsync();
  return { status: requested.granted ? 'granted' : 'denied', openSettings: false };
}

/** Opens the OS notification settings for the app (`Linking.openSettings`). */
export async function openNotificationSettings(): Promise<void> {
  await Linking.openSettings();
}

/** Whether the user already dismissed the contextual onboarding. */
export async function hasDismissedNotificationPrompt(): Promise<boolean> {
  return (await AsyncStorage.getItem(PROMPT_DISMISSED_KEY)) === 'true';
}

/** Persists the "Ahora no" choice so the onboarding is not shown again. */
export async function dismissNotificationPrompt(): Promise<void> {
  await AsyncStorage.setItem(PROMPT_DISMISSED_KEY, 'true');
}

/**
 * The contextual screen is shown right after the first login/register on the
 * device, unless the prompt was dismissed or permission is already granted.
 */
export async function shouldShowNotificationOnboarding(): Promise<boolean> {
  if (await hasDismissedNotificationPrompt()) {
    return false;
  }
  return (await getNotificationPermission()) !== 'granted';
}
