import { router } from 'expo-router';

import { Note, ScreenContainer, TopBar } from '@/components/ui';

export default function AccountsScreen() {
  return (
    <>
      <TopBar title="Cuentas" onBack={() => router.back()} />
      <ScreenContainer>
        <Note>El listado de cuentas y tarjetas se implementa en las features F06–F07.</Note>
      </ScreenContainer>
    </>
  );
}
