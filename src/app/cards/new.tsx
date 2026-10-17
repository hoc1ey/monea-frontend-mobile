import { router } from 'expo-router';

import { Note, ScreenContainer, TopBar } from '@/components/ui';

export default function NewCardScreen() {
  return (
    <>
      <TopBar title="Nueva tarjeta" onBack={() => router.back()} />
      <ScreenContainer>
        <Note>El formulario de tarjeta se implementa en la feature de tarjetas (F07).</Note>
      </ScreenContainer>
    </>
  );
}
