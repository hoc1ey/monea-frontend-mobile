import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';

import { restoreSession } from '@/auth/session';
import { BrandLogo } from '@/components/auth/BrandLogo';
import { useAuthStore } from '@/stores/auth';
import { typography, useThemeColors } from '@/theme';

/** Minimum time the splash stays visible, even if the session resolves faster. */
const MIN_DURATION = 600;

export default function SplashScreen() {
  const colors = useThemeColors();

  useEffect(() => {
    let active = true;
    const startedAt = Date.now();

    restoreSession().then((authenticated) => {
      if (!active) {
        return;
      }

      const delay = Math.max(0, MIN_DURATION - (Date.now() - startedAt));
      setTimeout(() => {
        if (!active) {
          return;
        }

        const mustChangePassword = useAuthStore.getState().mustChangePassword;
        if (!authenticated) {
          router.replace('/login');
        } else {
          router.replace(mustChangePassword ? '/force-change-password' : '/');
        }
      }, delay);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <BrandLogo pulse />
      <Text style={[styles.title, { color: colors.text }]}>MONEA</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>Cargando tus finanzas…</Text>
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
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 18,
  },
  subtitle: {
    ...typography.subhead,
    marginTop: 4,
  },
});
