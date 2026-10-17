import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';
import { Lock } from 'lucide-react-native';

import { Button } from '@/components/ui';
import { ICON_STROKE, typography, useThemeColors } from '@/theme';

const DEFAULT_RETRY_MINUTES = 15;

export default function LockScreen() {
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ kind?: string; retryAfterMinutes?: string }>();
  const isAccount = params.kind !== 'ip';

  const [remaining, setRemaining] = useState(() => {
    const minutes = Number(params.retryAfterMinutes ?? DEFAULT_RETRY_MINUTES);
    return Math.max(0, Math.round(minutes * 60));
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((value) => (value > 0 ? value - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(remaining / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (remaining % 60).toString().padStart(2, '0');

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
        <Lock size={38} color={colors.accentInk} strokeWidth={ICON_STROKE} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        {isAccount ? 'Cuenta bloqueada' : 'Acceso bloqueado'}
      </Text>

      <Text style={[styles.message, { color: colors.muted }]}>
        {isAccount
          ? 'Demasiados intentos fallidos. Intenta de nuevo en'
          : 'Demasiados intentos desde tu conexión. Intenta de nuevo en'}
      </Text>

      <Text style={[styles.timer, { color: colors.accentInk }]}>
        {minutes}:{seconds}
      </Text>

      <Text style={[styles.hint, { color: colors.muted }]}>
        {isAccount
          ? 'Tu cuenta se desbloquea automáticamente.'
          : 'El bloqueo es por IP y no afecta a otras cuentas.'}
      </Text>

      <View style={styles.action}>
        <Button title="Entendido" onPress={() => router.replace('/login')} />
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
  },
  message: {
    ...typography.subhead,
    textAlign: 'center',
    maxWidth: 280,
    marginTop: 6,
  },
  timer: {
    fontSize: 52,
    lineHeight: 60,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    marginTop: 14,
    marginBottom: 4,
  },
  hint: {
    ...typography.footnote,
    textAlign: 'center',
  },
  action: {
    width: '100%',
    marginTop: 22,
  },
});
