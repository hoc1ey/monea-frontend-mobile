import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { isApiError } from '@/api/client';
import { useToast } from '@/components/ui';
import { useAccounts } from '@/features/accounts/useAccounts';
import { ObligationForm } from '@/features/obligations/ObligationForm';
import {
  isObligationKind,
  OBLIGATION_KIND_CONFIG,
  type ObligationFormPayload,
} from '@/features/obligations/obligations';
import { useCreateObligation } from '@/features/obligations/useObligationMutations';
import { detectTimezone } from '@/lib/timezone';
import { useAuthStore } from '@/stores/auth';

/** `/obligations/[tab]/new` — generic creation form (F11). */
export default function NewObligationScreen() {
  const { tab } = useLocalSearchParams<{ tab: string }>();
  const kind = isObligationKind(tab) ? tab : 'cobros';

  const toast = useToast();
  const accounts = useAccounts();
  const timezone = useAuthStore((state) => state.user?.timezone) ?? detectTimezone();
  const createObligation = useCreateObligation(kind);

  if (!isObligationKind(tab)) {
    return <Redirect href={{ pathname: '/obligations/[tab]', params: { tab: 'cobros' } }} />;
  }

  const handleSubmit = async (payload: ObligationFormPayload) => {
    try {
      await createObligation.mutateAsync(payload);
      toast.show(OBLIGATION_KIND_CONFIG[kind].createdToast);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace({ pathname: '/obligations/[tab]', params: { tab: kind } });
      }
    } catch (error) {
      toast.show(isApiError(error) ? error.message : 'No se pudo guardar el registro');
    }
  };

  return (
    <ObligationForm
      kind={kind}
      accounts={accounts.data ?? []}
      timezone={timezone}
      onBack={() => router.back()}
      onSubmit={handleSubmit}
    />
  );
}
