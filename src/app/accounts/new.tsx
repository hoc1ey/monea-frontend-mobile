import { router } from 'expo-router';

import { isApiError } from '@/api/client';
import { useToast } from '@/components/ui';
import { AccountForm } from '@/features/accounts/AccountForm';
import { useCreateAccount } from '@/features/accounts/useAccountMutations';

export default function NewAccountScreen() {
  const toast = useToast();
  const createAccount = useCreateAccount();

  return (
    <AccountForm
      title="Nueva cuenta"
      onBack={() => router.back()}
      onSubmit={async (values) => {
        try {
          await createAccount.mutateAsync(values);
          toast.show('Cuenta creada');
          router.back();
        } catch (error) {
          toast.show(isApiError(error) ? error.message : 'No se pudo guardar la cuenta');
        }
      }}
    />
  );
}
