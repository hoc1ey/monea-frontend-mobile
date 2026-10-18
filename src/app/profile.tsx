import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';
import { WifiOff } from 'lucide-react-native';

import { getErrorMessage } from '@/api/client';
import type { UserProfile } from '@/api/users';
import {
  Avatar,
  Banner,
  Button,
  Field,
  Group,
  ScreenContainer,
  Select,
  Skeleton,
  TopBar,
  useToast,
} from '@/components/ui';
import { useProfile, useUpdateProfile } from '@/features/profile/useProfile';
import { TIMEZONE_OPTIONS, buildTimezoneOptions, detectTimezone } from '@/lib/timezone';
import { radii, typography, useThemeColors } from '@/theme';

const detectedTimezone = detectTimezone();

function ProfileSkeleton() {
  const colors = useThemeColors();

  return (
    <View>
      <View style={styles.head}>
        <Skeleton width={96} height={96} radius={48} />
        <Skeleton width={140} height={22} style={styles.skeletonName} />
        <Skeleton width={180} height={16} style={styles.skeletonEmail} />
      </View>
      <View style={[styles.skeletonGroup, { backgroundColor: colors.surface }]}>
        <Skeleton height={32} />
        <Skeleton height={32} />
        <Skeleton height={32} />
        <Skeleton height={32} />
      </View>
    </View>
  );
}

/** Editable profile card. Mounted only once `GET /users/me` resolved. */
function ProfileForm({ profile }: { profile: UserProfile }) {
  const colors = useThemeColors();
  const { show } = useToast();
  const update = useUpdateProfile();
  const [name, setName] = useState(profile.name);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [nameError, setNameError] = useState<string | undefined>(undefined);

  const timezoneOptions = useMemo(() => {
    const values = [profile.timezone, detectedTimezone, ...TIMEZONE_OPTIONS].filter(
      (value): value is string => Boolean(value),
    );

    return buildTimezoneOptions(values);
  }, [profile.timezone]);

  const handleSave = async () => {
    const trimmed = name.trim();

    if (trimmed.length < 2) {
      setNameError('Ingresa tu nombre');
      return;
    }

    setNameError(undefined);

    try {
      await update.mutateAsync({ name: trimmed, timezone });
      show('Perfil guardado');
    } catch (error) {
      show(getErrorMessage(error, 'No se pudo guardar el perfil'));
    }
  };

  return (
    <>
      <View style={styles.head}>
        <Avatar name={name || profile.name} size={96} gradient />
        <Text style={[styles.name, { color: colors.text }]}>{name || profile.name}</Text>
        <Text style={[styles.email, { color: colors.muted }]}>{profile.email}</Text>
      </View>

      <Group>
        <Field
          label="Nombre"
          value={name}
          onChangeText={(value) => {
            setName(value);
            if (nameError) {
              setNameError(undefined);
            }
          }}
          error={nameError}
        />
        <Field label="Correo" value={profile.email} editable={false} />
        <Select
          label="Zona horaria"
          options={timezoneOptions}
          value={timezone}
          onChange={setTimezone}
        />
        <Field label="Moneda" value="USD" editable={false} />
      </Group>

      <Button
        title="Editar perfil"
        variant="ghost"
        loading={update.isPending}
        onPress={handleSave}
        style={styles.button}
      />
    </>
  );
}

/** `/profile` — user profile with inline name/timezone editing (F15). */
export default function ProfileScreen() {
  const colors = useThemeColors();
  const profile = useProfile();

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar title="Perfil" onBack={() => router.back()} />
      <ScreenContainer>
        {profile.isPending ? (
          <ProfileSkeleton />
        ) : profile.isError ? (
          <Banner
            icon={WifiOff}
            title="Sin conexión"
            subtitle="No pudimos cargar tu perfil"
            onPress={() => profile.refetch()}
          />
        ) : (
          <ProfileForm profile={profile.data} />
        )}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  head: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 18,
  },
  name: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    marginTop: 14,
  },
  email: {
    ...typography.subhead,
    marginTop: 2,
  },
  button: {
    marginTop: 16,
  },
  skeletonName: {
    marginTop: 14,
  },
  skeletonEmail: {
    marginTop: 8,
  },
  skeletonGroup: {
    gap: 12,
    padding: 14,
    borderRadius: radii.card,
  },
});
