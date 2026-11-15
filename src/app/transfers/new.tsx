import { StyleSheet, View } from 'react-native';

import { router } from 'expo-router';
import { Landmark, WifiOff } from 'lucide-react-native';

import { getErrorMessage } from '@/api/client';
import {
  Banner,
  Button,
  EmptyState,
  ScreenContainer,
  Skeleton,
  TopBar,
  useToast,
} from '@/components/ui';
import { useAccounts } from '@/features/accounts/useAccounts';
import { TransferForm, type TransferFormPayload } from '@/features/transfers/TransferForm';
import { useCreateTransfer } from '@/features/transfers/useTransfers';
import { radii, useThemeColors } from '@/theme';

export default function NewTransferScreen() {
  const colors = useThemeColors();
  const toast = useToast();
  const accounts = useAccounts();
  const createTransfer = useCreateTransfer();

  const handleSubmit = async (payload: TransferFormPayload) => {
    try {
      await createTransfer.mutateAsync(payload);
      toast.show('Transferencia registrada');
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/movements');
      }
    } catch (error) {
      toast.show(getErrorMessage(error, 'No se pudo registrar la transferencia'));
    }
  };

  if (accounts.isPending) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <TopBar title="Nueva transferencia" onBack={() => router.back()} />
        <ScreenContainer>
          <View style={styles.skeleton}>
            <Skeleton height={80} radius={radii.card} />
            <Skeleton height={220} radius={radii.card} />
          </View>
        </ScreenContainer>
      </View>
    );
  }

  if (accounts.isError) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <TopBar title="Nueva transferencia" onBack={() => router.back()} />
        <ScreenContainer>
          <Banner
            icon={WifiOff}
            title="Sin conexión"
            subtitle="No pudimos cargar tus cuentas"
            onPress={() => void accounts.refetch()}
          />
          <Button title="Reintentar" variant="ghost" onPress={() => void accounts.refetch()} />
        </ScreenContainer>
      </View>
    );
  }

  if ((accounts.data ?? []).length < 2) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <TopBar title="Nueva transferencia" onBack={() => router.back()} />
        <ScreenContainer>
          <EmptyState
            icon={Landmark}
            title="Necesitas dos cuentas"
            message="Para transferir necesitas al menos dos cuentas propias."
          />
          <Button
            title="Crear cuenta"
            variant="ghost"
            onPress={() => router.push('/accounts/new')}
          />
        </ScreenContainer>
      </View>
    );
  }

  return (
    <TransferForm
      accounts={accounts.data ?? []}
      onBack={() => router.back()}
      onSubmit={handleSubmit}
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
