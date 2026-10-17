import { Linking, Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { registerDevice, unregisterDevice } from '@/api/notifications';

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

/**
 * Registers the current FCM token with the backend. Best effort: a missing
 * permission, an emulator without FCM or an offline request never throws.
 */
export async function registerDeviceToken(): Promise<void> {
  if (!Device.isDevice || (await getNotificationPermission()) !== 'granted') {
    return;
  }

  try {
    const token = await Notifications.getDevicePushTokenAsync();
    if (typeof token.data === 'string' && token.data.length > 0) {
      await registerDevice({ token: token.data, platform: 'ANDROID' });
    }
  } catch {
    // Ignore: the token is re-registered on the next authenticated launch.
  }
}

/**
 * Re-registers the device whenever FCM rotates the token while the app runs.
 * Returns the subscription so the caller can remove it on unmount/logout.
 */
export function addDeviceTokenRotationListener(): ReturnType<
  typeof Notifications.addPushTokenListener
> {
  return Notifications.addPushTokenListener((token) => {
    if (typeof token.data === 'string' && token.data.length > 0) {
      registerDevice({ token: token.data, platform: 'ANDROID' }).catch(() => undefined);
    }
  });
}

/** Deactivates the device on the backend (best effort, never throws). */
export async function unregisterDeviceToken(): Promise<void> {
  try {
    const token = await Notifications.getDevicePushTokenAsync();
    if (typeof token.data === 'string' && token.data.length > 0) {
      await unregisterDevice(token.data);
    }
  } catch {
    // Best effort: logout must continue even if this fails.
  }
}

/** Reminder kinds sent by the backend in the push payload. */
export type ReminderType =
  | 'CREDIT_CARD_PAYMENT'
  | 'RECURRING_EXPENSE'
  | 'COLLECTION'
  | 'LOAN'
  | 'DEBT';

type NotificationData = Record<string, unknown>;

function readString(data: NotificationData, key: string): string | null {
  const value = data[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** Current period (`YYYY-MM`) used to open the active credit-card statement. */
export function currentPeriod(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Maps a push payload to the in-app route to open, following the F04 table.
 * Returns `null` when the payload is incomplete or unknown.
 */
export function getNotificationRoute(data: NotificationData): string | null {
  const type = readString(data, 'type');
  const sourceId = readString(data, 'sourceId');
  const parentId = readString(data, 'parentId');

  switch (type) {
    case 'CREDIT_CARD_PAYMENT':
      return sourceId ? `/cards/${sourceId}?period=${currentPeriod()}` : null;
    case 'RECURRING_EXPENSE':
      return sourceId ? `/recurring/${sourceId}` : null;
    case 'COLLECTION': {
      const id = parentId ?? sourceId;
      return id ? `/obligations/cobros/${id}` : null;
    }
    case 'LOAN': {
      const id = parentId ?? sourceId;
      return id ? `/obligations/prestamos/${id}` : null;
    }
    case 'DEBT': {
      const id = parentId ?? sourceId;
      return id ? `/obligations/deudas/${id}` : null;
    }
    default:
      return null;
  }
}
