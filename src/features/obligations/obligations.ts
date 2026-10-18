import {
  createCollection,
  createDebt,
  createLoan,
  deleteCollection,
  deleteDebt,
  deleteLoan,
  getCollection,
  getCollections,
  getDebt,
  getDebts,
  getLoan,
  getLoans,
  payCollectionInstallment,
  payDebtInstallment,
  payLoanInstallment,
  updateCollection,
  updateDebt,
  updateLoan,
  type Collection,
  type Debt,
  type Loan,
  type ObligationInstallment,
  type ObligationReminderInput,
  type ObligationStatus,
  type PayInstallmentInput,
} from '@/api/obligations';
import type { SegmentedOption } from '@/components/ui';
import { roundMoney } from '@/lib/format';

/** Route slug shared by the three obligation tabs (`obligations/[tab]`). */
export type ObligationKind = 'cobros' | 'prestamos' | 'deudas';

/** Any obligation returned by the API. */
export type Obligation = Collection | Loan | Debt;

export interface ObligationKindConfig {
  kind: ObligationKind;
  plural: string;
  singular: string;
  /** Title of the creation screen, e.g. "Nuevo cobro". */
  newTitle: string;
  /** Toast shown after a successful creation. */
  createdToast: string;
  /** Collections and loans accept a description; debts do not. */
  hasDescription: boolean;
  /** Only loans require the source account. */
  hasAccount: boolean;
}

export const OBLIGATION_KIND_CONFIG: Record<ObligationKind, ObligationKindConfig> = {
  cobros: {
    kind: 'cobros',
    plural: 'Cobros',
    singular: 'Cobro',
    newTitle: 'Nuevo cobro',
    createdToast: 'Cobro creado',
    hasDescription: true,
    hasAccount: false,
  },
  prestamos: {
    kind: 'prestamos',
    plural: 'Préstamos',
    singular: 'Préstamo',
    newTitle: 'Nuevo préstamo',
    createdToast: 'Préstamo registrado · egreso creado',
    hasDescription: true,
    hasAccount: true,
  },
  deudas: {
    kind: 'deudas',
    plural: 'Deudas',
    singular: 'Deuda',
    newTitle: 'Nueva deuda',
    createdToast: 'Deuda creada',
    hasDescription: false,
    hasAccount: false,
  },
};

export const OBLIGATION_TABS: SegmentedOption<ObligationKind>[] = [
  { value: 'cobros', label: 'Cobros' },
  { value: 'prestamos', label: 'Préstamos' },
  { value: 'deudas', label: 'Deudas' },
];

/** Cache keys shared with the home dashboard (`['collections']`, …). */
export const OBLIGATION_QUERY_KEYS: Record<ObligationKind, readonly string[]> = {
  cobros: ['collections'],
  prestamos: ['loans'],
  deudas: ['debts'],
};

export function isObligationKind(value: unknown): value is ObligationKind {
  return value === 'cobros' || value === 'prestamos' || value === 'deudas';
}

/** Normalized shape used by the shared list/detail components. */
export interface ObligationView {
  id: string;
  personName: string;
  totalAmount: number;
  installmentsCount: number;
  installments: ObligationInstallment[];
  paidAmount: number;
  pendingAmount: number;
  paidCount: number;
  description: string | null;
  accountId: string | null;
  status: ObligationStatus;
}

/** Collapses a collection/loan/debt into the shared view model. */
export function toObligationView(item: Obligation): ObligationView {
  const installments = item.installments ?? [];
  const paidCount = installments.filter((installment) => installment.isPaid).length;
  const paidAmount =
    item.paidAmount ??
    roundMoney(
      installments
        .filter((installment) => installment.isPaid)
        .reduce((total, installment) => total + installment.amount, 0),
    );

  return {
    id: item.id,
    personName: item.personName,
    totalAmount: item.totalAmount,
    installmentsCount: item.installmentsCount,
    installments,
    paidAmount,
    pendingAmount: item.pendingAmount ?? roundMoney(item.totalAmount - paidAmount),
    paidCount,
    description: 'description' in item ? item.description : null,
    accountId: 'accountId' in item ? item.accountId : null,
    status: item.status,
  };
}

/** Sums the pending amount of a list, rounded to 2 decimals. */
export function sumPending(items: ObligationView[]): number {
  return roundMoney(items.reduce((total, item) => total + item.pendingAmount, 0));
}

/** Body produced by `ObligationForm` before it is mapped to each DTO. */
export interface ObligationFormPayload {
  personName: string;
  totalAmount: number;
  installmentsCount: number;
  description?: string;
  accountId?: string;
  reminder: ObligationReminderInput;
}

/**
 * Editable fields of an existing obligation. `accountId` and `totalAmount` are
 * never sent: loans keep them immutable and the plan is only regenerated when
 * no installment has been paid yet.
 */
export interface ObligationUpdatePayload {
  personName: string;
  installmentsCount?: number;
  description?: string;
  reminder: ObligationReminderInput;
}

/* ------------------------------ API dispatch ------------------------------ */

export async function fetchObligations(kind: ObligationKind): Promise<Obligation[]> {
  if (kind === 'prestamos') {
    return getLoans();
  }
  if (kind === 'deudas') {
    return getDebts();
  }
  return getCollections();
}

export async function fetchObligation(kind: ObligationKind, id: string): Promise<Obligation> {
  if (kind === 'prestamos') {
    return getLoan(id);
  }
  if (kind === 'deudas') {
    return getDebt(id);
  }
  return getCollection(id);
}

export async function createObligation(
  kind: ObligationKind,
  payload: ObligationFormPayload,
): Promise<Obligation> {
  const base = {
    personName: payload.personName,
    totalAmount: payload.totalAmount,
    installmentsCount: payload.installmentsCount,
    ...payload.reminder,
  };

  if (kind === 'prestamos') {
    return createLoan({
      ...base,
      accountId: payload.accountId ?? '',
      ...(payload.description ? { description: payload.description } : {}),
    });
  }
  if (kind === 'deudas') {
    return createDebt(base);
  }
  return createCollection({
    ...base,
    ...(payload.description ? { description: payload.description } : {}),
  });
}

export async function updateObligation(
  kind: ObligationKind,
  id: string,
  payload: ObligationUpdatePayload,
): Promise<Obligation> {
  const base = {
    personName: payload.personName,
    ...(payload.installmentsCount != null ? { installmentsCount: payload.installmentsCount } : {}),
    ...payload.reminder,
    ...(payload.description != null ? { description: payload.description } : {}),
  };

  if (kind === 'prestamos') {
    return updateLoan(id, base);
  }
  if (kind === 'deudas') {
    return updateDebt(id, base);
  }
  return updateCollection(id, base);
}

export async function deleteObligation(kind: ObligationKind, id: string): Promise<void> {
  if (kind === 'prestamos') {
    await deleteLoan(id);
    return;
  }
  if (kind === 'deudas') {
    await deleteDebt(id);
    return;
  }
  await deleteCollection(id);
}

export async function payObligationInstallment(
  kind: ObligationKind,
  id: string,
  installmentId: string,
  input: PayInstallmentInput,
): Promise<void> {
  if (kind === 'prestamos') {
    await payLoanInstallment(id, installmentId, input);
    return;
  }
  if (kind === 'deudas') {
    await payDebtInstallment(id, installmentId, input);
    return;
  }
  await payCollectionInstallment(id, installmentId, input);
}
