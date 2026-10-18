import { StyleSheet, View } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';
import { CreditCard, WifiOff } from 'lucide-react-native';

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
import { CardForm } from '@/features/cards/CardForm';
import { useCreditCard } from '@/features/cards/useCreditCards';
import { useUpdateCreditCard } from '@/features/cards/useCreditCardMutations';
import { radii, useThemeColors } from '@/theme';

export default function EditCardScreen() {
  const colors = useThemeColors();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const card = useCreditCard(id);
  const updateCard = useUpdateCreditCard(id);

  if (card.isPending) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <TopBar title="Editar tarjeta" onBack={() => router.back()} />
        <ScreenContainer>
          <View style={styles.skeleton}>
            <Skeleton height={120} radius={radii.card} />
            <Skeleton height={120} radius={radii.card} />
          </View>
        </ScreenContainer>
      </View>
    );
  }

  if (card.isError || !card.data) {
    const notFound = isApiError(card.error) && card.error.status === 404;

    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <TopBar title="Editar tarjeta" onBack={() => router.back()} />
        <ScreenContainer>
          {notFound ? (
            <EmptyState icon={CreditCard} title="Tarjeta no encontrada" />
          ) : (
            <>
              <Banner
                icon={WifiOff}
                title="Sin conexión"
                subtitle="No pudimos cargar la tarjeta"
                onPress={() => void card.refetch()}
              />
              <Button title="Reintentar" variant="ghost" onPress={() => void card.refetch()} />
            </>
          )}
        </ScreenContainer>
      </View>
    );
  }

  return (
    <CardForm
      title="Editar tarjeta"
      card={card.data}
      onBack={() => router.back()}
      onSubmit={async (values) => {
        try {
          await updateCard.mutateAsync(values);
          toast.show('Tarjeta actualizada');
          router.back();
        } catch (error) {
          toast.show(getErrorMessage(error, 'No se pudo guardar la tarjeta'));
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
