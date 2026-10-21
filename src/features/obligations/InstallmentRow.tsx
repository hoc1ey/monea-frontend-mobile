import { StyleSheet, Text, View } from 'react-native';

import { toZonedTime } from 'date-fns-tz';

import type { ObligationInstallment } from '@/api/obligations';
import { Button, Row, Tag } from '@/components/ui';
import { formatDate, formatMoney } from '@/lib/format';
import { radii, typography, useThemeColors } from '@/theme';

/** Neutral 34 dp tile showing the installment number (prototype `.ico.neutral`). */
function NumberTile({ value }: { value: number }) {
  const colors = useThemeColors();

  return (
    <View style={[styles.tile, { backgroundColor: colors.fill }]}>
      <Text style={[styles.tileText, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

export interface InstallmentRowProps {
  installment: ObligationInstallment;
  /** User timezone used to render `dueDate` (`d MMM yyyy`). */
  timezone: string;
  paying?: boolean;
  onPay?: (installment: ObligationInstallment) => void;
}

/**
 * Installment row: number tile, amount, due date and either a `Tag ok` when
 * paid or a small "Marcar pagada" button that opens the pay sheet.
 */
export function InstallmentRow({ installment, timezone, paying, onPay }: InstallmentRowProps) {
  const due = installment.dueDate
    ? formatDate(toZonedTime(installment.dueDate, timezone), 'd MMM yyyy')
    : 'Sin fecha';

  return (
    <Row
      leading={<NumberTile value={installment.number} />}
      title={formatMoney(installment.amount)}
      subtitle={due}
      right={
        installment.isPaid ? (
          <Tag label="Pagada" variant="ok" />
        ) : (
          <Button
            title="Marcar pagada"
            small
            loading={paying}
            onPress={() => onPay?.(installment)}
            accessibilityLabel={`Marcar pagada la cuota ${installment.number}`}
          />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 34,
    height: 34,
    borderRadius: radii.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: {
    ...typography.kicker,
    fontWeight: '700',
  },
});
