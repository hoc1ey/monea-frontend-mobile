import { Redirect, useLocalSearchParams } from 'expo-router';

import { isObligationKind } from '@/features/obligations/obligations';
import { ObligationDetail } from '@/features/obligations/ObligationDetail';

/** `/obligations/[tab]/[id]` — obligation detail with installments (F11). */
export default function ObligationDetailScreen() {
  const { tab, id } = useLocalSearchParams<{ tab: string; id: string }>();

  if (!isObligationKind(tab)) {
    return <Redirect href={{ pathname: '/obligations/[tab]', params: { tab: 'cobros' } }} />;
  }

  return <ObligationDetail kind={tab} id={id} />;
}
