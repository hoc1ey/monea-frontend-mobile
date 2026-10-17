import { useEffect } from 'react';

import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';

import { getNotificationRoute } from '@/lib/notifications';

function openFromNotification(response: Notifications.NotificationResponse): void {
  const data = response.notification.request.content.data as Record<string, unknown> | undefined;
  const route = getNotificationRoute(data ?? {});
  if (route) {
    router.push(route as Href);
  }
}

/**
 * Listens for notification taps (including the one that cold-started the app)
 * and navigates to the screen mapped by `data.type` (F04).
 */
export function NotificationObserver(): null {
  useEffect(() => {
    const last = Notifications.getLastNotificationResponse();
    if (last) {
      openFromNotification(last);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(openFromNotification);
    return () => subscription.remove();
  }, []);

  return null;
}
