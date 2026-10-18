import { router } from 'expo-router';

import { getErrorMessage } from '@/api/client';
import { useToast } from '@/components/ui';
import {
  NewShoppingListForm,
  type NewShoppingListValues,
} from '@/features/shopping/NewShoppingListForm';
import { useCreateShoppingList } from '@/features/shopping/useShoppingListMutations';

/** `/shopping/new` — creates an open shopping list with initial items (F14). */
export default function NewShoppingListScreen() {
  const toast = useToast();
  const createList = useCreateShoppingList();

  const handleSubmit = async (values: NewShoppingListValues) => {
    try {
      const created = await createList.mutateAsync(values);
      toast.show('Lista creada');
      router.replace({ pathname: '/shopping/[tab]/[id]', params: { tab: 'open', id: created.id } });
    } catch (error) {
      toast.show(getErrorMessage(error, 'No se pudo crear la lista'));
    }
  };

  return <NewShoppingListForm onBack={() => router.back()} onSubmit={handleSubmit} />;
}
