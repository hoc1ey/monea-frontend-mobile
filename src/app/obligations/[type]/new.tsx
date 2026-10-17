import { router, useLocalSearchParams } from 'expo-router';

import { Note, ScreenContainer, TopBar } from '@/components/ui';

const TITLES: Record<string, string> = {
  cobros: 'Nuevo cobro',
  prestamos: 'Nuevo préstamo',
  deudas: 'Nueva deuda',
};

export default function NewObligationScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const title = TITLES[type] ?? 'Nuevo registro';

  return (
    <>
      <TopBar title={title} onBack={() => router.back()} />
      <ScreenContainer>
        <Note>El formulario de obligaciones se implementa en las features F11–F13.</Note>
      </ScreenContainer>
    </>
  );
}
