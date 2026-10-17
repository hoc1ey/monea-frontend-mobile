import { router } from 'expo-router';

import { Note, ScreenContainer, TopBar } from '@/components/ui';

export default function NewIncomeScreen() {
  return (
    <>
      <TopBar title="Nuevo ingreso" onBack={() => router.back()} />
      <ScreenContainer>
        <Note>Formulario de ingreso disponible en la feature de movimientos (F08).</Note>
      </ScreenContainer>
    </>
  );
}
