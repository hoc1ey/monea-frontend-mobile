import { router } from 'expo-router';

import { isApiError } from '@/api/client';
import { useToast } from '@/components/ui';
import { CardForm } from '@/features/cards/CardForm';
import { useCreateCreditCard } from '@/features/cards/useCreditCardMutations';

export default function NewCardScreen() {
  const toast = useToast();
  const createCard = useCreateCreditCard();

  return (
    <CardForm
      title="Nueva tarjeta"
      onBack={() => router.back()}
      onSubmit={async (values) => {
        try {
          await createCard.mutateAsync(values);
          toast.show('Tarjeta creada');
          router.back();
        } catch (error) {
          toast.show(isApiError(error) ? error.message : 'No se pudo guardar la tarjeta');
        }
      }}
    />
  );
}
