import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useController, useForm } from 'react-hook-form';
import { z } from 'zod';

import { getErrorMessage, getRetryAfterMinutes, isApiError } from '@/api/client';
import { signIn } from '@/auth/session';
import { BrandLogo } from '@/components/auth/BrandLogo';
import { Button, Field, Group } from '@/components/ui';
import { shouldShowNotificationOnboarding } from '@/lib/notifications';
import { typography, useThemeColors } from '@/theme';

const schema = z.object({
  email: z.string().min(1, 'Ingresa tu correo').email('Correo inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

type LoginForm = z.infer<typeof schema>;

export default function LoginScreen() {
  const colors = useThemeColors();
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'jhon@example.com', password: '********' },
  });

  const email = useController({ control, name: 'email' });
  const password = useController({ control, name: 'password' });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await signIn(values);
      const showOnboarding = await shouldShowNotificationOnboarding();
      router.replace(showOnboarding ? '/notifications-onboarding' : '/');
    } catch (error) {
      const status = isApiError(error) ? error.status : 0;

      if (status === 423 || status === 429) {
        router.push({
          pathname: '/lock',
          params: {
            kind: status === 429 ? 'ip' : 'account',
            retryAfterMinutes: String(getRetryAfterMinutes(error) ?? 15),
          },
        });
        return;
      }

      setFormError(status === 401 || status === 400 ? 'Credenciales inválidas' : getErrorMessage(error, 'Error inesperado'));
    }
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.screen, { backgroundColor: colors.bg }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <BrandLogo size={140} />
          <Text style={[styles.title, { color: colors.text }]}>MONEA</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Tus finanzas, en orden</Text>
        </View>

        <Group>
          <Field
            label="Correo"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder={email.field.value}
            onChangeText={email.field.onChange}
            onBlur={email.field.onBlur}
            error={email.fieldState.error?.message}
          />
          <Field
            label="Contraseña"
            autoCapitalize="none"
            secureTextEntry
            placeholder={password.field.value}
            onChangeText={password.field.onChange}
            onBlur={password.field.onBlur}
            error={password.fieldState.error?.message}
          />
        </Group>

        {formError ? <Text style={[styles.formError, { color: colors.negative }]}>{formError}</Text> : null}

        <View style={styles.buttonwrap}>
          <Button
            title="Iniciar sesión"
            loading={formState.isSubmitting}
            onPress={onSubmit}
          />
        </View>

        <View style={styles.links}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/register')}>
            <Text style={[styles.link, { color: colors.accentInk }]}>Crear cuenta</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 28,
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
    textAlign: 'center',
    marginTop: 4,
  },
  formError: {
    ...typography.footnote,
    marginTop: 8,
  },
  buttonwrap: {
    marginTop: 28,
    marginBottom: 4,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  link: {
    ...typography.subhead,
    fontWeight: '500',
  },
});
