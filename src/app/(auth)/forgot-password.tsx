import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Mail, MailCheck } from 'lucide-react-native';
import { useController, useForm } from 'react-hook-form';
import { z } from 'zod';

import { forgotPassword } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import {
  Button,
  Field,
  Group,
  Note,
  ScreenContainer,
  TextButton,
  TopBar,
} from '@/components/ui';
import { ICON_STROKE, typography, useThemeColors } from '@/theme';

const schema = z.object({
  email: z.string().min(1, 'Ingresa tu correo').email('Correo inválido'),
});

type ForgotForm = z.infer<typeof schema>;

/** `/forgot-password` — requests a temporary password by email (EMAILS 4.1). */
export default function ForgotPasswordScreen() {
  const colors = useThemeColors();
  const [formError, setFormError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<ForgotForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const email = useController({ control, name: 'email' });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      const result = await forgotPassword(values.email.trim());
      if (!result.sent) {
        setFormError(result.message);
        return;
      }

      setSentMessage(result.message);
    } catch (error) {
      setFormError(getErrorMessage(error, 'No se pudo enviar el correo'));
    }
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar title="Recuperar contraseña" onBack={() => router.back()} />
      <ScreenContainer>
        <View style={styles.intro}>
          <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
            {sentMessage ? (
              <MailCheck size={38} color={colors.accentInk} strokeWidth={ICON_STROKE} />
            ) : (
              <Mail size={38} color={colors.accentInk} strokeWidth={ICON_STROKE} />
            )}
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {sentMessage ? 'Revisa tu correo' : '¿Olvidaste tu contraseña?'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {sentMessage
              ? sentMessage
              : 'Ingresa tu correo y te enviaremos una contraseña temporal para que puedas volver a entrar.'}
          </Text>
        </View>

        {sentMessage ? (
          <>
            <Note>
              Inicia sesión con la contraseña temporal. Al entrar, la app te pedirá cambiarla por
              una nueva.
            </Note>

            <Button
              title="Volver a iniciar sesión"
              onPress={() => router.replace('/login')}
              style={styles.button}
            />

            <View style={styles.retry}>
              <TextButton title="Usar otro correo" onPress={() => setSentMessage(null)} />
            </View>
          </>
        ) : (
          <>
            <Group>
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
            </Group>

            {formError ? (
              <Text style={[styles.formError, { color: colors.negative }]}>{formError}</Text>
            ) : null}

            <Button
              title="Enviar contraseña temporal"
              loading={formState.isSubmitting}
              onPress={onSubmit}
              style={styles.button}
            />

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.muted }]}>¿Ya la recordaste?</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.replace('/login')}
                hitSlop={8}
              >
                <Text style={[styles.link, { color: colors.accentInk }]}>Inicia sesión</Text>
              </Pressable>
            </View>
          </>
        )}
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
  formError: {
    ...typography.footnote,
    marginTop: 12,
  },
  button: {
    marginTop: 16,
  },
  retry: {
    alignItems: 'center',
    marginTop: 8,
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
