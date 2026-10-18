import { useState } from 'react';

import type { Account } from '@/api/accounts';
import { Button, Group, Select, Sheet, type SelectOption } from '@/components/ui';
import { formatMoney } from '@/lib/format';

export interface PayInstallmentSheetProps {
  visible: boolean;
  personName: string;
  amount: number;
  accounts: Account[];
  isPaying: boolean;
  /** Label of the account row; loans/debts may override it. */
  accountLabel?: string;
  onClose: () => void;
  onConfirm: (accountId: string) => void;
}

/**
 * "Marcar cuota como pagada" sheet: shows the person and amount, and lets the
 * user pick the destination account before confirming.
 */
export function PayInstallmentSheet({
  visible,
  personName,
  amount,
  accounts,
  isPaying,
  accountLabel = 'Cuenta destino',
  onClose,
  onConfirm,
}: PayInstallmentSheetProps) {
  const firstAccountId = accounts[0]?.id ?? '';
  const [accountId, setAccountId] = useState(firstAccountId);
  const [prevVisible, setPrevVisible] = useState(visible);

  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setAccountId(firstAccountId);
    }
  }

  const selectedId = accountId || firstAccountId;

  const options: SelectOption<string>[] = accounts.map((account) => ({
    value: account.id,
    label: `${account.name} · ${formatMoney(account.currentBalance)}`,
  }));

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Marcar cuota como pagada"
      subtitle={`${personName} · ${formatMoney(amount)}`}
    >
      <Group>
        <Select
          label={accountLabel}
          value={selectedId || undefined}
          options={options}
          placeholder="Seleccionar cuenta"
          onChange={setAccountId}
        />
      </Group>
      <Button
        title="Confirmar"
        loading={isPaying}
        disabled={!selectedId}
        onPress={() => onConfirm(selectedId)}
        style={{ marginTop: 16 }}
      />
    </Sheet>
  );
}
