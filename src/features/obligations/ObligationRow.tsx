import { Avatar, Row } from '@/components/ui';
import { formatMoney } from '@/lib/format';

import type { ObligationView } from './obligations';

export interface ObligationRowProps {
  obligation: ObligationView;
  onPress: () => void;
}

/** List row for a collection/loan/debt (prototype `.row` with initials avatar). */
export function ObligationRow({ obligation, onPress }: ObligationRowProps) {
  return (
    <Row
      leading={<Avatar name={obligation.personName} size={38} />}
      title={obligation.personName}
      subtitle={`${obligation.paidCount} de ${obligation.installmentsCount} cuotas pagadas`}
      value={formatMoney(obligation.totalAmount)}
      onPress={onPress}
      accessibilityLabel={`${obligation.personName}: ${obligation.paidCount} de ${obligation.installmentsCount} cuotas pagadas`}
    />
  );
}
