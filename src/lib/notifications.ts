import { Platform } from 'react-native';

import * as Notifications from 'expo-notifications';

/** Android channel used by every reminder push (F04). */
export const REMINDERS_CHANNEL_ID = 'recordatorios';

/** Accent color (cerise-600) applied to notifications, matches the prototype. */
export const NOTIFICATION_COLOR = '#EF13A1';

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
