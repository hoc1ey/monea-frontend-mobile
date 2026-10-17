import { router } from 'expo-router';

import { Note, ScreenContainer, TopBar } from '@/components/ui';

export default function DefineAmountScreen() {
  return (
    <>
      <TopBar title="Definir monto" onBack={() => router.back()} />
      <ScreenContainer>
        <Note>La definición de montos pendientes se implementa en la feature de recurrentes (F10).</Note>
      </ScreenContainer>
    </>
  );
}
