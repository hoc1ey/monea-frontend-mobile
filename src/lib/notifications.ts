import { Linking, Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { isRunningInExpoGo } from 'expo';
import * as Device from 'expo-device';

import { registerDevice, unregisterDevice } from '@/api/notifications';

type NotificationsModule = typeof import('expo-notifications');
type PushTokenSubscription = ReturnType<NotificationsModule['addPushTokenListener']>;
type NotificationResponseSubscription = ReturnType<
  NotificationsModule['addNotificationResponseReceivedListener']
>;
type NotificationResponse = Parameters<
  Parameters<NotificationsModule['addNotificationResponseReceivedListener']>[0]
>[0];

/**
 * Lazily requires `expo-notifications`. Remote push requires a development build
 * and Expo Go on Android has lacked the package's native modules since SDK 53,
 * so evaluating it there throws and importing it eagerly would take the whole
 * app down. The module is only loaded outside Expo Go and any failure degrades
 * to a no-op instead of crashing.
 */
let notificationsModule: NotificationsModule | null | undefined;

function getNotificationsModule(): NotificationsModule | null {
  if (notificationsModule !== undefined) {
    return notificationsModule;
  }

  if (isRunningInExpoGo()) {
    notificationsModule = null;
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notificationsModule = require('expo-notifications') as NotificationsModule;
  } catch {
    notificationsModule = null;
  }

  return notificationsModule;
}

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
  getNotificationsModule()?.setNotificationHandler({
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
  const notifications = getNotificationsModule();
  if (Platform.OS !== 'android' || !notifications) {
    return;
  }

  await notifications.setNotificationChannelAsync(REMINDERS_CHANNEL_ID, {
    name: 'Recordatorios',
    importance: notifications.AndroidImportance.HIGH,
    lightColor: NOTIFICATION_COLOR,
    sound: 'default',
  });
}

/** Current authorization status, normalized to a plain string. */
export async function getNotificationPermission(): Promise<NotificationPermission> {
  const notifications = getNotificationsModule();
  if (!notifications) {
    return 'undetermined';
  }

  const settings = await notifications.getPermissionsAsync();
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
  const notifications = getNotificationsModule();
  if (!notifications) {
    return { status: 'undetermined', openSettings: false };
  }

  const current = await notifications.getPermissionsAsync();

  if (current.granted) {
    return { status: 'granted', openSettings: false };
  }

  if (!current.canAskAgain) {
    return { status: 'denied', openSettings: true };
  }

  const requested = await notifications.requestPermissionsAsync();
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
  const notifications = getNotificationsModule();
  if (!notifications || !Device.isDevice) {
    return;
  }

  if ((await getNotificationPermission()) !== 'granted') {
    return;
  }

  try {
    const token = await notifications.getDevicePushTokenAsync();
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
export function addDeviceTokenRotationListener(): PushTokenSubscription {
  const notifications = getNotificationsModule();
  if (!notifications) {
    return { remove: () => undefined };
  }

  return notifications.addPushTokenListener((token) => {
    if (typeof token.data === 'string' && token.data.length > 0) {
      registerDevice({ token: token.data, platform: 'ANDROID' }).catch(() => undefined);
    }
  });
}

/** Deactivates the device on the backend (best effort, never throws). */
export async function unregisterDeviceToken(): Promise<void> {
  const notifications = getNotificationsModule();
  if (!notifications) {
    return;
  }

  try {
    const token = await notifications.getDevicePushTokenAsync();
    if (typeof token.data === 'string' && token.data.length > 0) {
      await unregisterDevice(token.data);
    }
  } catch {
    // Best effort: logout must continue even if this fails.
  }
}

function readNotificationData(response: NotificationResponse): Record<string, unknown> {
  const data = response.notification.request.content.data;
  return (data as Record<string, unknown> | undefined) ?? {};
}

/**
 * Invokes `onData` with the payload of a tapped notification, including the one
 * that cold-started the app. Returns the subscription to remove on unmount.
 */
export function addNotificationResponseListener(
  onData: (data: Record<string, unknown>) => void
): NotificationResponseSubscription {
  const notifications = getNotificationsModule();
  if (!notifications) {
    return { remove: () => undefined };
  }

  const last = notifications.getLastNotificationResponse();
  if (last) {
    onData(readNotificationData(last));
  }

  return notifications.addNotificationResponseReceivedListener((response) => {
    onData(readNotificationData(response));
  });
}

/** Reminder kinds sent by the backend in the push payload. */
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
