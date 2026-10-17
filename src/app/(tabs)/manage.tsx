import { LayoutGrid } from 'lucide-react-native';

import { EmptyState, LargeHeader, ScreenContainer } from '@/components/ui';

export default function ManageScreen() {
  return (
    <ScreenContainer>
      <LargeHeader title="Gestión" subtitle="Lo que te deben, lo que debes y tus compras" />
      <EmptyState
        icon={LayoutGrid}
        title="Gestiona tus finanzas"
        message="Aquí verás tus cobros, préstamos, deudas y listas de compras."
      />
    </ScreenContainer>
  );
}
