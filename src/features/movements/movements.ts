import { differenceInCalendarDays, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { ArrowDown, CreditCard, Repeat, ShoppingCart } from 'lucide-react-native';

import type { Expense, ExpensePaymentMethod, ExpenseSourceType } from '@/api/expenses';
import type { Income, IncomeSourceType } from '@/api/incomes';
import type { IconComponent } from '@/components/ui';
import { formatDate } from '@/lib/format';

/** Chips on the movements screen. */
export type MovementFilter = 'all' | 'income' | 'expense' | 'deferred' | 'recurring';

export type MovementKind = 'income' | 'expense';

/**
 * How much of a movement can be edited:
 * - `full`: every field; - `limited`: only name and description; - `none`: read-only.
 */
export type MovementEditability = 'full' | 'limited' | 'none';

export type MovementSourceType = IncomeSourceType | ExpenseSourceType;

/** Unified income/expense row consumed by the list and detail screens. */
export interface Movement {
  id: string;
  kind: MovementKind;
  sourceType: MovementSourceType;
  name: string;
  amount: number;
  description: string | null;
  date: string;
  accountId: string;
  /** Recurring variable expense whose amount still has to be set. */
  pending: boolean;
  /** Deferred expense charged to a credit card. */
  deferred: boolean;
  origin: string;
  /** Human label for the "Forma de pago" row. */
  paymentMethodLabel: string;
  /** Generated automatically by another module (not `MANUAL`). */
  automatic: boolean;
  editability: MovementEditability;
  deletable: boolean;
}

export const INCOME_ORIGIN: Record<IncomeSourceType, string> = {
  MANUAL: 'Manual',
  COLLECTION_INSTALLMENT: 'Cobro',
  LOAN_INSTALLMENT: 'Préstamo',
};

export const EXPENSE_ORIGIN: Record<ExpenseSourceType, string> = {
  MANUAL: 'Manual',
  RECURRING: 'Recurrente',
  CARD_PAYMENT: 'Tarjeta',
  LOAN_CREATION: 'Préstamo',
  DEBT_PAYMENT: 'Deuda',
  SHOPPING_LIST: 'Lista',
};

function expensePaymentLabel(paymentMethod: ExpensePaymentMethod, installments: number | null): string {
  if (paymentMethod === 'DIFERIDO') {
    return installments != null ? `Diferido · ${installments} cuotas` : 'Diferido';
  }
  return 'Corriente';
}

/** Maps an income to the unified movement shape. */
export function incomeToMovement(income: Income): Movement {
  const manual = income.sourceType === 'MANUAL';

  return {
    id: income.id,
    kind: 'income',
    sourceType: income.sourceType,
    name: income.name,
    amount: income.amount,
    description: income.description,
    date: income.date,
    accountId: income.accountId,
    pending: false,
    deferred: false,
    origin: INCOME_ORIGIN[income.sourceType],
    paymentMethodLabel: '—',
    automatic: !manual,
    editability: manual ? 'full' : 'limited',
    deletable: manual,
  };
}

/**
 * Maps an expense to the unified movement shape. Deferred expenses are owned
 * by F09, so they stay read-only here until that feature lands.
 */
export function expenseToMovement(expense: Expense): Movement {
  const deferred = expense.paymentMethod === 'DIFERIDO';
  const editable = !deferred && (expense.sourceType === 'MANUAL' || expense.sourceType === 'RECURRING');

  return {
    id: expense.id,
    kind: 'expense',
    sourceType: expense.sourceType,
    name: expense.name,
    amount: expense.amount,
    description: expense.description,
    date: expense.date,
    accountId: expense.accountId,
    pending: expense.amountPending,
    deferred,
    origin: EXPENSE_ORIGIN[expense.sourceType],
    paymentMethodLabel: expensePaymentLabel(expense.paymentMethod, expense.installments),
    automatic: expense.sourceType !== 'MANUAL',
    editability: editable ? 'full' : 'none',
    deletable: editable,
  };
}

/** Tile icon per movement (prototype `mvRow`). */
export function movementIcon(movement: Movement): IconComponent {
  if (movement.kind === 'income') {
    return ArrowDown;
  }
  if (movement.sourceType === 'RECURRING') {
    return Repeat;
  }
  if (movement.deferred || movement.sourceType === 'CARD_PAYMENT') {
    return CreditCard;
  }
  return ShoppingCart;
}

/** A day group on the movements list. */
export interface MovementSection {
  title: string;
  data: Movement[];
}

/**
 * Groups movements by calendar day (user timezone), labelling the current and
 * previous day as "Hoy"/"Ayer" and older ones as `d MMM` (e.g. "15 oct").
 */
export function groupMovements(
  movements: Movement[],
  timezone: string,
  now: Date,
): MovementSection[] {
  const sections: MovementSection[] = [];
  const byDay = new Map<number, MovementSection>();

  for (const movement of movements) {
    const zoned = toZonedTime(movement.date, timezone);
    const day = startOfDay(zoned);
    const key = day.getTime();
    let section = byDay.get(key);

    if (!section) {
      const diff = differenceInCalendarDays(day, startOfDay(now));
      const title = diff === 0 ? 'Hoy' : diff === 1 ? 'Ayer' : formatDate(day, 'd MMM');
      section = { title, data: [] };
      byDay.set(key, section);
      sections.push(section);
    }

    section.data.push(movement);
  }

  return sections;
}

/** Builds a list of movements sorted by `date` DESC. */
export function sortMovements(movements: Movement[]): Movement[] {
  return [...movements].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
