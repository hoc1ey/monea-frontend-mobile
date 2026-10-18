import { useCallback, useState } from 'react';

import { useFocusEffect } from 'expo-router';

import {
  getNotificationPermission,
  openNotificationSettings,
  registerDeviceToken,
  requestNotificationPermission,
  type NotificationPermission,
} from '@/lib/notifications';

export interface NotificationPermissionState {
  permission: NotificationPermission;
  /** `true` when the OS permission is currently granted. */
  granted: boolean;
  /** Re-reads the system permission (called on screen focus). */
  refresh: () => void;
  /**
   * Toggles the switch: a granted permission opens the system settings (the app
   * cannot revoke it), a denied one opens settings too, and an undetermined one
   * requests the permission.
   */
  toggle: () => Promise<void>;
}

/** Reflects the push permission of the OS and mirrors F04's registration flow. */
export function useNotificationPermission(): NotificationPermissionState {
  const [permission, setPermission] = useState<NotificationPermission>('undetermined');

  const refresh = useCallback(() => {
    getNotificationPermission()
      .then(setPermission)
      .catch(() => undefined);
  }, []);

  useFocusEffect(refresh);

  const toggle = useCallback(async () => {
    if (permission === 'granted') {
      await openNotificationSettings();
      return;
    }

    const result = await requestNotificationPermission();

    if (result.status === 'granted') {
      await registerDeviceToken();
    } else if (result.openSettings) {
      await openNotificationSettings();
    }

    refresh();
  }, [permission, refresh]);

  return { permission, granted: permission === 'granted', refresh, toggle };
}
