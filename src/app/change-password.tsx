import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useController, useForm } from 'react-hook-form';
import { z } from 'zod';

import { isApiError } from '@/api/client';
import { clearSession } from '@/auth/session';
import {
  Button,
  Field,
  Group,
  LargeHeader,
  ScreenContainer,
  TextButton,
  TopBar,
  useToast,
} from '@/components/ui';
import { useChangePassword } from '@/features/settings/useChangePassword';
import { typography, useThemeColors } from '@/theme';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
    newPassword: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe incluir una mayúscula')
      .regex(/[a-z]/, 'Debe incluir una minúscula')
      .regex(/\d/, 'Debe incluir un número'),
    confirmPassword: z.string().min(1, 'Confirma la nueva contraseña'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type ChangePasswordForm = z.infer<typeof schema>;

/** `/change-password` — changes the password and re-signs the user in (F15). */
export default function ChangePasswordScreen() {
  const colors = useThemeColors();
  const { show } = useToast();
  const change = useChangePassword();
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<ChangePasswordForm>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const currentPassword = useController({ control, name: 'currentPassword' });
  const newPassword = useController({ control, name: 'newPassword' });
  const confirmPassword = useController({ control, name: 'confirmPassword' });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await change.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      await clearSession();
      router.replace('/login');
      show('Contraseña actualizada. Vuelve a iniciar sesión.');
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        setFormError('La contraseña actual no es correcta');
        return;
      }
      setFormError(isApiError(error) ? error.message : 'No se pudo cambiar la contraseña');
    }
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar
        title="Cambiar contraseña"
        onBack={() => router.back()}
        right={<TextButton title="Guardar" onPress={onSubmit} />}
      />
      <ScreenContainer>
        <LargeHeader
          title="Contraseña"
          subtitle="Al cambiarla se cerrarán tus sesiones activas."
        />

        <Group>
          <Field
            label="Actual"
            autoCapitalize="none"
            secureTextEntry
            value={currentPassword.field.value}
            onChangeText={currentPassword.field.onChange}
            onBlur={currentPassword.field.onBlur}
            error={currentPassword.fieldState.error?.message}
          />
          <Field
            label="Nueva"
            autoCapitalize="none"
            secureTextEntry
            value={newPassword.field.value}
            onChangeText={newPassword.field.onChange}
            onBlur={newPassword.field.onBlur}
            error={newPassword.fieldState.error?.message}
          />
          <Field
            label="Confirmar"
            autoCapitalize="none"
            secureTextEntry
            value={confirmPassword.field.value}
            onChangeText={confirmPassword.field.onChange}
            onBlur={confirmPassword.field.onBlur}
            error={confirmPassword.fieldState.error?.message}
          />
        </Group>

        {formError ? (
          <Text style={[styles.formError, { color: colors.negative }]}>{formError}</Text>
        ) : null}

        <Button
          title="Actualizar contraseña"
          loading={formState.isSubmitting}
          onPress={onSubmit}
          style={styles.button}
        />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  formError: {
    ...typography.footnote,
    marginTop: 12,
  },
  button: {
    marginTop: 16,
  },
});
