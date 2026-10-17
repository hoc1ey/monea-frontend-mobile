import { router } from 'expo-router';

import { Note, ScreenContainer, TopBar } from '@/components/ui';

export default function NewShoppingListScreen() {
  return (
    <>
      <TopBar title="Nueva lista" onBack={() => router.back()} />
      <ScreenContainer>
        <Note>El formulario de lista de compras se implementa en la feature de listas (F14).</Note>
      </ScreenContainer>
    </>
  );
}
