import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useController, useForm } from 'react-hook-form';
import { z } from 'zod';

import { getErrorMessage, isApiError } from '@/api/client';
import { clearSession, signOut } from '@/auth/session';
import { forgetTempPassword, takeTempPassword } from '@/auth/passwordGate';
import {
  Button,
  Field,
  Group,
  LargeHeader,
  Note,
  ScreenContainer,
  TextButton,
  TopBar,
  useToast,
} from '@/components/ui';
import { useChangePassword } from '@/features/settings/useChangePassword';
import { useAuthStore } from '@/stores/auth';
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

/**
 * `/change-password` — changes the password and re-signs the user in (F15).
 * When `user.mustChangePassword` is `true` it becomes a mandatory gate after a
 * temporary password login (EMAILS 4.3): no back navigation and no tabs.
 */
export default function ChangePasswordScreen() {
  const colors = useThemeColors();
  const forced = useAuthStore((state) => state.mustChangePassword);
  const { show } = useToast();
  const change = useChangePassword();
  const [formError, setFormError] = useState<string | null>(null);
  // The temporary password typed at login was kept in memory (EMAIL-VERIFY 4.3);
  // taking it consumes it, so it never reaches persistent storage.
  const [savedTempPassword] = useState(() => takeTempPassword());

  const { control, handleSubmit, formState } = useForm<ChangePasswordForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: forced ? (savedTempPassword ?? '') : '',
      newPassword: '',
      confirmPassword: '',
    },
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
      forgetTempPassword();
      await clearSession();
      router.replace('/login');
      show('Contraseña actualizada. Vuelve a iniciar sesión.');
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        setFormError('La contraseña actual no es correcta');
        return;
      }
      setFormError(getErrorMessage(error, 'No se pudo cambiar la contraseña'));
    }
  });

  const handleSignOut = async () => {
    forgetTempPassword();
    await signOut();
    router.replace('/login');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar
        title={forced ? 'Seguridad' : 'Cambiar contraseña'}
        onBack={forced ? undefined : () => router.back()}
        showBack={!forced}
        loading={formState.isSubmitting}
        right={
          forced ? (
            <TextButton title="Salir" onPress={handleSignOut} />
          ) : (
            <TextButton title="Guardar" disabled={formState.isSubmitting} onPress={onSubmit} />
          )
        }
      />
      <ScreenContainer>
        <LargeHeader
          title={forced ? 'Cambia tu contraseña' : 'Contraseña'}
          subtitle={
            forced
              ? 'Por seguridad, reemplaza la contraseña temporal antes de continuar.'
              : 'Al cambiarla se cerrarán tus sesiones activas.'
          }
        />

        <Group>
          <Field
            label={forced ? 'Temporal' : 'Actual'}
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

        <Note>Mínimo 8 caracteres, con mayúscula, minúscula y número.</Note>

        {formError ? (
          <Text style={[styles.formError, { color: colors.negative }]}>{formError}</Text>
        ) : null}

        <Button
          title={forced ? 'Guardar y continuar' : 'Actualizar contraseña'}
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
