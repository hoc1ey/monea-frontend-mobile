import { useState } from 'react';

import { Redirect, useLocalSearchParams } from 'expo-router';

import { isObligationKind, type ObligationKind } from '@/features/obligations/obligations';
import { ObligationScreen } from '@/features/obligations/ObligationScreen';

/**
 * `/obligations/[tab]` — collections, loans or debts list (F11). Switching the
 * segment only updates local state: replacing the route param would remount
 * the screen instead of just swapping the header and the list below it.
 */
export default function ObligationsScreen() {
  const { tab } = useLocalSearchParams<{ tab: string }>();
  const [kind, setKind] = useState<ObligationKind>(isObligationKind(tab) ? tab : 'cobros');

  if (!isObligationKind(tab)) {
    return <Redirect href={{ pathname: '/obligations/[tab]', params: { tab: 'cobros' } }} />;
  }

  return <ObligationScreen tab={kind} onChangeTab={setKind} />;
}
