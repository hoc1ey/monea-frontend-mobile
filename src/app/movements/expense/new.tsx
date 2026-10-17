import { useState } from 'react';

import { Note, ScreenContainer, Segmented } from '@/components/ui';

type ExpenseKind = 'instant' | 'diferido' | 'recurrente';

export default function NewExpenseScreen() {
  const [kind, setKind] = useState<ExpenseKind>('instant');

  return (
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
  );
}
