import { View } from 'react-native';

import { ArrowUpDown } from 'lucide-react-native';

import { Fab } from '@/components/navigation/Fab';
import { EmptyState, LargeHeader, ScreenContainer } from '@/components/ui';
import { useUiStore } from '@/stores/ui';

export default function MovementsScreen() {
  const openQuickActions = useUiStore((state) => state.openQuickActions);

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer>
        <LargeHeader title="Movimientos" />
        <EmptyState
          icon={ArrowUpDown}
          title="Sin movimientos"
          message="Registra tu primer ingreso o egreso con el botón +."
        />
      </ScreenContainer>
      <Fab onPress={openQuickActions} />
    </View>
  );
}
