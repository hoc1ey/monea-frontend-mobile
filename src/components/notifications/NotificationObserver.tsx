import { useEffect } from 'react';

import { router, type Href } from 'expo-router';

import { addNotificationResponseListener, getNotificationRoute } from '@/lib/notifications';

/**
 * Listens for notification taps (including the one that cold-started the app)
 * and navigates to the screen mapped by `data.type` (F04).
 */
export function NotificationObserver(): null {
  useEffect(() => {
    const subscription = addNotificationResponseListener((data) => {
      const route = getNotificationRoute(data);
      if (route) {
        router.push(route as Href);
      }
    });
    return () => subscription.remove();
  }, []);

  return null;
}
