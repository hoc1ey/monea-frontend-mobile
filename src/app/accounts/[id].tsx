import { router } from 'expo-router';

import { Note, ScreenContainer, TopBar } from '@/components/ui';

export default function AccountDetailScreen() {
  return (
    <>
      <TopBar title="Cuenta" onBack={() => router.back()} />
      <ScreenContainer>
        <Note>El detalle de la cuenta se implementa en la feature de cuentas (F06).</Note>
      </ScreenContainer>
    </>
  );
}
