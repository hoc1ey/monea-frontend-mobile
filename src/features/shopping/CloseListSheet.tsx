import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import type { Account } from '@/api/accounts';
import type { CloseShoppingListInput, ShoppingListItem } from '@/api/shoppingLists';
import { AmountInput, Button, Group, Select, Sheet, type SelectOption } from '@/components/ui';
import { formatMoney, roundMoney } from '@/lib/format';
import { typography, useThemeColors } from '@/theme';

import { buildCloseInput } from './shopping';

export interface CloseListSheetProps {
  visible: boolean;
  items: ShoppingListItem[];
  pricesOn: boolean;
  manualTotal: string;
  accounts: Account[];
  isClosing: boolean;
  onClose: () => void;
  /** Marks the card of the offending item when a purchased price is missing. */
  onHighlightItem: (itemId: string) => void;
  onConfirm: (input: CloseShoppingListInput) => void;
}

/**
 * "Cerrar lista" sheet (F14): shows the total and the paying account and
 * validates the API XOR rule (prices per purchased item or a manual total).
 */
export function CloseListSheet({
  visible,
  items,
  pricesOn,
  manualTotal,
  accounts,
  isClosing,
  onClose,
  onHighlightItem,
  onConfirm,
}: CloseListSheetProps) {
  const colors = useThemeColors();
  const firstAccountId = accounts[0]?.id ?? '';
  const [accountId, setAccountId] = useState(firstAccountId);
  const [error, setError] = useState<string | null>(null);
  const [prevVisible, setPrevVisible] = useState(visible);

  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setAccountId(firstAccountId);
      setError(null);
    }
  }

  const selectedId = accountId || firstAccountId;

  const purchasedTotal = roundMoney(
    items
      .filter((item) => item.isPurchased)
      .reduce((total, item) => total + (item.price ?? 0), 0),
  );
  const manual = roundMoney(Number(manualTotal) || 0);
  const effectiveTotal = pricesOn ? purchasedTotal : manual;

  const options: SelectOption<string>[] = accounts.map((account) => ({
    value: account.id,
    label: `${account.name} · ${formatMoney(account.currentBalance)}`,
  }));

  const confirm = () => {
    const result = buildCloseInput(items, pricesOn, manualTotal, selectedId);
    if (!result.ok) {
      setError(result.error);
      if (result.highlightItemId) {
        onHighlightItem(result.highlightItemId);
      }
      return;
    }

    setError(null);
    onConfirm(result.input);
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Cerrar lista"
      subtitle="Se registrará un egreso por el total de la compra"
    >
      <AmountInput value={effectiveTotal.toFixed(2)} onChangeText={() => { }} editable={false} />
      <Group>
        <Select
          label="Cuenta de pago"
          value={selectedId || undefined}
          options={options}
          placeholder="Seleccionar cuenta"
          onChange={setAccountId}
        />
      </Group>

      {error ? <Text style={[styles.error, { color: colors.negative }]}>{error}</Text> : null}


      <Button
        title="Cerrar y registrar egreso"
        loading={isClosing}
        disabled={!selectedId}
        onPress={confirm}
        style={styles.button}
      />

    </Sheet>
  );
}

const styles = StyleSheet.create({
  error: {
    ...typography.footnote,
    textAlign: 'center',
    marginTop: 12,
  },
  button: {
    marginTop: 16,
  },
});
