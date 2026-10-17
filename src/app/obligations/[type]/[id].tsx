import { router, useLocalSearchParams } from 'expo-router';

import { Note, ScreenContainer, TopBar } from '@/components/ui';

const TITLES: Record<string, string> = {
  cobros: 'Cobro',
  prestamos: 'Préstamo',
  deudas: 'Deuda',
};

export default function ObligationDetailScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const title = TITLES[type] ?? 'Detalle';

  return (
    <>
      <TopBar title={title} onBack={() => router.back()} />
      <ScreenContainer>
        <Note>El detalle de obligaciones se implementa en las features F11–F13.</Note>
      </ScreenContainer>
    </>
  );
}
