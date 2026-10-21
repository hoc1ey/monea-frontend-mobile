import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Bell, Key, LayoutGrid, LogOut, Smartphone } from 'lucide-react-native';

import { signOut, signOutAll } from '@/auth/session';
import {
  Button,
  Group,
  Row,
  ScreenContainer,
  SectionHeader,
  Segmented,
  Sheet,
  Switch,
  TopBar,
  type SegmentedOption,
} from '@/components/ui';
import { useNotificationPermission } from '@/features/settings/useNotificationPermission';
import { useThemeStore, type ThemePreference } from '@/stores/theme';
import { typography, useThemeColors } from '@/theme';

const THEME_OPTIONS: SegmentedOption<ThemePreference>[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

/** `/settings` — appearance, security and notification settings (F15). */
export default function SettingsScreen() {
  const colors = useThemeColors();
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  const notifications = useNotificationPermission();
  const [confirmCloseAll, setConfirmCloseAll] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  const handleSignOutAll = async () => {
    setConfirmCloseAll(false);
    await signOutAll();
    router.replace('/login');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar title="Ajustes" onBack={() => router.back()} />
      <ScreenContainer>
        <SectionHeader title="Apariencia" />
        <Group>
          <View style={styles.segmentWrap}>
            <Segmented
              options={THEME_OPTIONS}
              value={preference}
              onChange={setPreference}
              style={styles.segment}
            />
          </View>
        </Group>

        <SectionHeader title="Seguridad" />
        <Group>
          <Row
            icon={Key}
            title="Cambiar contraseña"
            onPress={() => router.push('/change-password')}
          />
          <Row icon={LogOut} title="Cerrar sesión" onPress={handleSignOut} />
          <Row
            icon={Smartphone}
            title="Cerrar todas las sesiones"
            onPress={() => setConfirmCloseAll(true)}
          />
        </Group>

        <SectionHeader title="Notificaciones" />
        <Group>
          <Row
            icon={Bell}
            title="Notificaciones push"
            right={
              <Switch
                value={notifications.granted}
                onValueChange={() => void notifications.toggle()}
                accessibilityLabel="Notificaciones push"
              />
            }
          />
          <Row icon={Smartphone} title="Dispositivos" value="1 activo" />
        </Group>

        {__DEV__ ? (
          <>
            <SectionHeader title="Desarrollo" />
            <Group>
              <Row
                icon={LayoutGrid}
                title="Vista previa de todas las pantallas"
                onPress={() => router.push('/dev')}
              />
            </Group>
          </>
        ) : null}

        <Text style={[styles.hint, { color: colors.muted }]}>Monea · v{APP_VERSION}</Text>
      </ScreenContainer>

      <Sheet
        visible={confirmCloseAll}
        onClose={() => setConfirmCloseAll(false)}
        title="Cerrar todas las sesiones"
        subtitle="Se cerrará la sesión en todos los dispositivos."
      >
        <Button title="Cerrar todas las sesiones" onPress={handleSignOutAll} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  segmentWrap: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  segment: {
    marginTop: 0,
    marginBottom: 0,
  },
  hint: {
    ...typography.footnote,
    textAlign: 'center',
    marginTop: 24,
  },
});
