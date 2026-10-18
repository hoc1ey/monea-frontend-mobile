import { StyleSheet, View } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';
import { Wallet, WifiOff } from 'lucide-react-native';

import { getErrorMessage, isApiError } from '@/api/client';
import {
  Banner,
  Button,
  EmptyState,
  ScreenContainer,
  Skeleton,
  TopBar,
  useToast,
} from '@/components/ui';
import { AccountForm } from '@/features/accounts/AccountForm';
import { useUpdateAccount } from '@/features/accounts/useAccountMutations';
import { useAccount } from '@/features/accounts/useAccounts';
import { radii, useThemeColors } from '@/theme';

export default function EditAccountScreen() {
  const colors = useThemeColors();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const account = useAccount(id);
  const updateAccount = useUpdateAccount(id);

  if (account.isPending) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <TopBar title="Editar cuenta" onBack={() => router.back()} />
        <ScreenContainer>
          <View style={styles.skeleton}>
            <Skeleton height={120} radius={radii.card} />
            <Skeleton height={120} radius={radii.card} />
          </View>
        </ScreenContainer>
      </View>
    );
  }

  if (account.isError || !account.data) {
    const notFound = isApiError(account.error) && account.error.status === 404;

    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <TopBar title="Editar cuenta" onBack={() => router.back()} />
        <ScreenContainer>
          {notFound ? (
            <EmptyState icon={Wallet} title="Cuenta no encontrada" />
          ) : (
            <>
              <Banner
                icon={WifiOff}
                title="Sin conexión"
                subtitle="No pudimos cargar la cuenta"
                onPress={() => void account.refetch()}
              />
              <Button title="Reintentar" variant="ghost" onPress={() => void account.refetch()} />
            </>
          )}
        </ScreenContainer>
      </View>
    );
  }

  return (
    <AccountForm
      title="Editar cuenta"
      account={account.data}
      onBack={() => router.back()}
      onSubmit={async (values) => {
        try {
          const result = await updateAccount.mutateAsync(values);
          toast.show(result.message || 'Cuenta actualizada');
          router.back();
        } catch (error) {
          toast.show(getErrorMessage(error, 'No se pudo guardar la cuenta'));
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  skeleton: {
    gap: 16,
    marginTop: 12,
  },
});
