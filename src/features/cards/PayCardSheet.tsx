import { useState } from 'react';

import type { Account } from '@/api/accounts';
import type { CreditCard } from '@/api/creditCards';
import { AmountInput, Button, Group, Select, Sheet, type SelectOption } from '@/components/ui';
import { formatMoney, formatPeriod } from '@/lib/format';

export interface PayCardSheetProps {
  visible: boolean;
  onClose: () => void;
  card: CreditCard;
  period: string;
  total: number;
  accounts: Account[];
  isPaying: boolean;
  onConfirm: (accountId: string) => void;
}

/**
 * "Pagar tarjeta" sheet: shows the period total and lets the user pick the
 * source account. `POST /credit-cards/:id/pay` is confirmed by the parent.
 */
export function PayCardSheet({
  visible,
  onClose,
  card,
  period,
  total,
  accounts,
  isPaying,
  onConfirm,
}: PayCardSheetProps) {
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
      title={`Pagar ${card.name}`}
      subtitle={`Periodo ${formatPeriod(period)} · se generará un egreso corriente`}
    >
      <AmountInput value={total.toFixed(2)} onChangeText={() => undefined} editable={false} />
      <Group>
        <Select
          label="Cuenta origen"
          value={selectedId || undefined}
          options={options}
          placeholder="Seleccionar cuenta"
          onChange={setAccountId}
        />
      </Group>
      <Button
        title="Confirmar pago"
        loading={isPaying}
        disabled={!selectedId}
        onPress={() => onConfirm(selectedId)}
        style={{ marginTop: 16 }}
      />
    </Sheet>
  );
}
