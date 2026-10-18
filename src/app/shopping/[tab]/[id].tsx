import { Redirect, useLocalSearchParams } from 'expo-router';

import { isShoppingTab } from '@/features/shopping/shopping';
import { ShoppingListDetail } from '@/features/shopping/ShoppingListDetail';

/** `/shopping/[tab]/[id]` — shopping list detail (F14). */
export default function ShoppingListDetailScreen() {
  const { tab, id } = useLocalSearchParams<{ tab: string; id: string }>();

  if (!isShoppingTab(tab)) {
    return <Redirect href={{ pathname: '/shopping/[tab]', params: { tab: 'open' } }} />;
  }

  return <ShoppingListDetail id={id} />;
}
