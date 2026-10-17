import { MoreHorizontal } from 'lucide-react-native';

import { EmptyState, LargeHeader, ScreenContainer } from '@/components/ui';

export default function MoreScreen() {
  return (
    <ScreenContainer>
      <LargeHeader title="Más" subtitle="Cuentas y ajustes" />
      <EmptyState
        icon={MoreHorizontal}
        title="Cuentas y ajustes"
        message="Aquí verás tus cuentas, tarjetas, recordatorios y preferencias."
      />
    </ScreenContainer>
  );
}
