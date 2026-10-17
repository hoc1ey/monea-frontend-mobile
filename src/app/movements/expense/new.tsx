import { useState } from 'react';

import { router } from 'expo-router';

import { Note, ScreenContainer, Segmented, TopBar } from '@/components/ui';

type ExpenseKind = 'instant' | 'diferido' | 'recurrente';

export default function NewExpenseScreen() {
  const [kind, setKind] = useState<ExpenseKind>('instant');

  return (
    <>
      <TopBar title="Nuevo egreso" onBack={() => router.back()} />
      <ScreenContainer>
        <Segmented<ExpenseKind>
          options={[
            { value: 'instant', label: 'Instantáneo' },
            { value: 'diferido', label: 'Diferido' },
            { value: 'recurrente', label: 'Recurrente' },
          ]}
          value={kind}
          onChange={setKind}
        />
        <Note>El formulario de egreso se implementa en las features de movimientos (F08–F10).</Note>
      </ScreenContainer>
    </>
  );
}
