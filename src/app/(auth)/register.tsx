import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useController, useForm } from 'react-hook-form';
import { z } from 'zod';

import { getErrorMessage } from '@/api/client';
import { signUp } from '@/auth/session';
import { Button, Field, Group, Note, ScreenContainer, Select, TopBar } from '@/components/ui';
import { shouldShowNotificationOnboarding } from '@/lib/notifications';
import { buildTimezoneOptions, detectTimezone, TIMEZONE_OPTIONS } from '@/lib/timezone';
import { typography, useThemeColors } from '@/theme';

const schema = z
  .object({
    name: z.string().min(2, 'Ingresa tu nombre'),
    email: z.string().min(1, 'Ingresa tu correo').email('Correo inválido'),
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe incluir una mayúscula')
      .regex(/[a-z]/, 'Debe incluir una minúscula')
      .regex(/\d/, 'Debe incluir un número'),
    confirmPassword: z.string().min(1, 'Repite la contraseña'),
    timezone: z.string().min(1, 'Selecciona una zona horaria'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof schema>;

const detectedTimezone = detectTimezone();
const timezoneOptions = buildTimezoneOptions([detectedTimezone, ...TIMEZONE_OPTIONS]);

export default function RegisterScreen() {
  const colors = useThemeColors();
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      timezone: detectedTimezone,
    },
  });

  const name = useController({ control, name: 'name' });
  const email = useController({ control, name: 'email' });
  const password = useController({ control, name: 'password' });
  const confirmPassword = useController({ control, name: 'confirmPassword' });
  const timezone = useController({ control, name: 'timezone' });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await signUp({
        name: values.name,
        email: values.email,
        password: values.password,
        timezone: values.timezone,
      });
      const showOnboarding = await shouldShowNotificationOnboarding();
      router.replace(showOnboarding ? '/notifications-onboarding' : '/');
    } catch (error) {
      setFormError(getErrorMessage(error, 'No se pudo crear la cuenta'));
    }
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar title="Crear cuenta" onBack={() => router.back()} />
      <ScreenContainer>
        <View style={styles.form}>
          <Group>
            <Field
              label="Nombre"
              placeholder="Ej. Juan"
              value={name.field.value}
              onChangeText={name.field.onChange}
              onBlur={name.field.onBlur}
              error={name.fieldState.error?.message}
            />
            <Field
              label="Correo"
              placeholder="Ej. juan@correo.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email.field.value}
              onChangeText={email.field.onChange}
              onBlur={email.field.onBlur}
              error={email.fieldState.error?.message}
            />
            <Field
              label="Contraseña"
              placeholder="Ej. Monea123*"
              autoCapitalize="none"
              secureTextEntry
              value={password.field.value}
              onChangeText={password.field.onChange}
              onBlur={password.field.onBlur}
              error={password.fieldState.error?.message}
            />
            <Field
              label="Repetir contraseña"
              placeholder="Ej. Monea123*"
              autoCapitalize="none"
              secureTextEntry
              value={confirmPassword.field.value}
              onChangeText={confirmPassword.field.onChange}
              onBlur={confirmPassword.field.onBlur}
              error={confirmPassword.fieldState.error?.message}
            />
            <Select
              label="Zona horaria"
              options={timezoneOptions}
              value={timezone.field.value}
              onChange={timezone.field.onChange}
            />
          </Group>

          <Note>Mínimo 8 caracteres, con mayúscula, minúscula y número.</Note>

          {formError ? <Text style={[styles.formError, { color: colors.negative }]}>{formError}</Text> : null}

          <Button
            title="Crear cuenta"
            loading={formState.isSubmitting}
            onPress={onSubmit}
            style={styles.button}
          />
        </View>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  form: {
    marginTop: 18,
  },
  formError: {
    ...typography.footnote,
    marginTop: 12,
  },
  button: {
    marginTop: 16,
  },
});
