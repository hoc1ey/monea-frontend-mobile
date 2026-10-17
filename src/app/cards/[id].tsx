import { router } from 'expo-router';

import { Note, ScreenContainer, TopBar } from '@/components/ui';

export default function CardDetailScreen() {
  return (
    <>
      <TopBar title="Tarjeta" onBack={() => router.back()} />
      <ScreenContainer>
        <Note>El detalle de la tarjeta se implementa en la feature de tarjetas (F07).</Note>
      </ScreenContainer>
    </>
  );
}
