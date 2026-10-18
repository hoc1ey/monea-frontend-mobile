import { Redirect, useLocalSearchParams } from 'expo-router';

import { isObligationKind } from '@/features/obligations/obligations';
import { ObligationScreen } from '@/features/obligations/ObligationScreen';

/** `/obligations/[tab]` — collections, loans or debts list (F11). */
export default function ObligationsScreen() {
  const { tab } = useLocalSearchParams<{ tab: string }>();

  if (!isObligationKind(tab)) {
    return <Redirect href={{ pathname: '/obligations/[tab]', params: { tab: 'cobros' } }} />;
  }

  return <ObligationScreen tab={tab} />;
}
