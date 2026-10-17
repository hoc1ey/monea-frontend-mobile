import { router } from 'expo-router';

import { Note, ScreenContainer, TopBar } from '@/components/ui';

export default function NewAccountScreen() {
  return (
    <>
      <TopBar title="Nueva cuenta" onBack={() => router.back()} />
      <ScreenContainer>
        <Note>El formulario de cuenta se implementa en la feature de cuentas (F06).</Note>
      </ScreenContainer>
    </>
  );
}
