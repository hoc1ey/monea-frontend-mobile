import { router } from 'expo-router';

import { Note, ScreenContainer, TopBar } from '@/components/ui';

export default function RecurringListScreen() {
  return (
    <>
      <TopBar title="Recurrentes" onBack={() => router.back()} />
      <ScreenContainer>
        <Note>El listado de egresos recurrentes se implementa en la feature de recurrentes (F10).</Note>
      </ScreenContainer>
    </>
  );
}
