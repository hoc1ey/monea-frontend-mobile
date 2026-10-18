import { Redirect, useLocalSearchParams } from 'expo-router';

import { isShoppingTab } from '@/features/shopping/shopping';
import { ShoppingScreen } from '@/features/shopping/ShoppingScreen';

/** `/shopping/[tab]` — open and closed shopping lists (F14). */
export default function ShoppingListsScreen() {
  const { tab } = useLocalSearchParams<{ tab: string }>();

  if (!isShoppingTab(tab)) {
    return <Redirect href={{ pathname: '/shopping/[tab]', params: { tab: 'open' } }} />;
  }

  return <ShoppingScreen tab={tab} />;
}
