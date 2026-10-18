import { useState } from 'react';

import { Button, Field, Sheet } from '@/components/ui';

export interface RenameListSheetProps {
  visible: boolean;
  currentName: string;
  isRenaming: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

/** "Editar" sheet (F14): renames an open list via PATCH /shopping-lists/:id. */
export function RenameListSheet({
  visible,
  currentName,
  isRenaming,
  onClose,
  onConfirm,
}: RenameListSheetProps) {
  const [name, setName] = useState(currentName);
  const [prevVisible, setPrevVisible] = useState(visible);

  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setName(currentName);
    }
  }

  const trimmed = name.trim();

  return (
    <Sheet visible={visible} onClose={onClose} title="Editar" subtitle="Renombra la lista">
      <Field
        label="Nombre"
        value={name}
        onChangeText={setName}
        placeholder="Nombre de la lista"
        maxLength={120}
        autoFocus
      />
      <Button
        title="Guardar"
        loading={isRenaming}
        disabled={!trimmed || trimmed === currentName}
        onPress={() => onConfirm(trimmed)}
      />
    </Sheet>
  );
}
