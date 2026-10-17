import { ArrowUpDown } from 'lucide-react-native';

import { EmptyState, LargeHeader, ScreenContainer } from '@/components/ui';

export default function MovementsScreen() {
  return (
    <ScreenContainer>
      <LargeHeader title="Movimientos" />
      <EmptyState
        icon={ArrowUpDown}
        title="Sin movimientos"
        message="Registra tu primer ingreso o egreso con el botón +."
      />
    </ScreenContainer>
  );
}
