import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';

import { Button, useToast } from '@/components/ui';
import {
  dismissNotificationPrompt,
  openNotificationSettings,
  requestNotificationPermission,
} from '@/lib/notifications';
import { ICON_STROKE, typography, useThemeColors } from '@/theme';

/**
 * Contextual screen shown right after the first login/register on a device
 * (F04): explains why notifications are useful before the system dialog.
 */
export default function NotificationsOnboardingScreen() {
  const colors = useThemeColors();
  const { show } = useToast();
  const [requesting, setRequesting] = useState(false);

  const handleActivate = async () => {
    setRequesting(true);
    try {
      const result = await requestNotificationPermission();
      if (result.openSettings) {
        await openNotificationSettings();
      } else if (result.status === 'denied') {
        show('Puedes activarlas más tarde desde Ajustes');
      }
    } finally {
      setRequesting(false);
      router.replace('/');
    }
  };

  const handleDismiss = async () => {
    await dismissNotificationPrompt();
    router.replace('/');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
        <Bell size={38} color={colors.accentInk} strokeWidth={ICON_STROKE} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>Activa tus recordatorios</Text>

      <Text style={[styles.message, { color: colors.muted }]}>
        Te avisamos antes de pagos de tarjeta, cuotas y egresos recurrentes.
      </Text>

      <View style={styles.actions}>
        <Button title="Activar notificaciones" loading={requesting} onPress={handleActivate} />
        <Button title="Ahora no" variant="ghost" onPress={handleDismiss} style={styles.ghost} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  icon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  message: {
    ...typography.subhead,
    textAlign: 'center',
    maxWidth: 280,
    marginTop: 6,
  },
  actions: {
    width: '100%',
    marginTop: 22,
    gap: 8,
  },
  ghost: {
    marginTop: 4,
  },
});
