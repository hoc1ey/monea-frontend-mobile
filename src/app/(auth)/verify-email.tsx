import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { MailCheck } from 'lucide-react-native';
import { useController, useForm } from 'react-hook-form';
import { z } from 'zod';

import { resendVerification } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { completeEmailVerification } from '@/auth/session';
import { Button, Field, Group, Note, ScreenContainer, TextButton, TopBar } from '@/components/ui';
import { shouldShowNotificationOnboarding } from '@/lib/notifications';
import { ICON_STROKE, typography, useThemeColors } from '@/theme';

const RESEND_COOLDOWN_SECONDS = 60;

const schema = z.object({
  email: z.string().min(1, 'Ingresa tu correo').email('Correo inválido'),
  code: z.string().regex(/^\d{6}$/, 'El código debe tener 6 dígitos'),
});

type VerifyForm = z.infer<typeof schema>;

/** `/verify-email` — 6-digit code sent after register; success issues tokens (EMAIL-VERIFY 3.2 / 3.3). */
export default function VerifyEmailScreen() {
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ email?: string }>();
  const initialEmail = typeof params.email === 'string' ? params.email : '';
  const [formError, setFormError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const { control, handleSubmit, formState, setError } = useForm<VerifyForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: initialEmail, code: '' },
  });

  const email = useController({ control, name: 'email' });
  const code = useController({ control, name: 'code' });

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      const user = await completeEmailVerification({
        email: values.email.trim(),
        code: values.code,
      });

      if (user.mustChangePassword) {
        router.replace('/force-change-password');
        return;
      }

      const showOnboarding = await shouldShowNotificationOnboarding();
      router.replace(showOnboarding ? '/notifications-onboarding' : '/');
    } catch (error) {
      setFormError(getErrorMessage(error, 'No se pudo verificar el código'));
    }
  });

  const handleResend = async () => {
    setFormError(null);
    setResendMessage(null);

    const parsedEmail = z.string().email().safeParse(email.field.value.trim());
    if (!parsedEmail.success) {
      setError('email', { message: 'Ingresa un correo válido' });
      return;
    }

    setResending(true);
    try {
      const result = await resendVerification(parsedEmail.data);
      setResendMessage(result.message);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      setFormError(getErrorMessage(error, 'No se pudo reenviar el código'));
    } finally {
      setResending(false);
    }
  };

  const cooldownLabel =
    cooldown > 0
      ? `Reenviar en ${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, '0')}`
      : 'Reenviar código';

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar title="Verificar correo" onBack={() => router.replace('/login')} />
      <ScreenContainer>
        <View style={styles.intro}>
          <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
            <MailCheck size={38} color={colors.accentInk} strokeWidth={ICON_STROKE} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Revisa tu correo</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {initialEmail ? (
              <>
                Enviamos un código de 6 dígitos a{' '}
                <Text style={[styles.email, { color: colors.text }]}>{initialEmail}</Text>.
              </>
            ) : (
              'Ingresa el código de 6 dígitos que enviamos a tu correo.'
            )}
          </Text>
        </View>

        <Group>
          {initialEmail ? null : (
            <Field
              label="Correo"
              placeholder="jhon@example.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email.field.value}
              onChangeText={email.field.onChange}
              onBlur={email.field.onBlur}
              error={email.fieldState.error?.message}
            />
          )}
          <Field
            label="Código"
            placeholder="123456"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            maxLength={6}
            value={code.field.value}
            onChangeText={code.field.onChange}
            onBlur={code.field.onBlur}
            error={code.fieldState.error?.message}
          />
        </Group>

        {formError ? (
          <Text style={[styles.formError, { color: colors.negative }]}>{formError}</Text>
        ) : null}

        <View style={styles.button}>
          <Button
            title="Verificar código"
            loading={formState.isSubmitting}
            onPress={onSubmit}
          />
        </View>

        <View style={styles.resend}>
          <TextButton
            title={cooldownLabel}
            disabled={cooldown > 0 || resending}
            onPress={handleResend}
          />
        </View>

        {resendMessage ? <Note>{resendMessage}</Note> : null}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.muted }]}>¿Ya verificaste?</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/login')}
            hitSlop={8}
          >
            <Text style={[styles.link, { color: colors.accentInk }]}>Inicia sesión</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  intro: {
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 22,
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
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.subhead,
    textAlign: 'center',
    maxWidth: 300,
    marginTop: 6,
  },
  email: {
    fontWeight: '600',
  },
  formError: {
    ...typography.footnote,
    marginTop: 12,
  },
  button: {
    marginTop: 16,
  },
  resend: {
    alignItems: 'center',
    marginTop: 21,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 22,
  },
  footerText: {
    ...typography.subhead,
  },
  link: {
    ...typography.subhead,
    fontWeight: '600',
  },
});
