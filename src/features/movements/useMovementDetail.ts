import { useQuery } from '@tanstack/react-query';

import { isApiError } from '@/api/client';
import { getExpense, type Expense } from '@/api/expenses';
import { getIncome, type Income } from '@/api/incomes';

import type { MovementKind } from './movements';

/** Stop retrying on 404 so the "Movimiento no encontrado" flow reacts immediately. */
export function retryMovement(failureCount: number, error: unknown): boolean {
  return failureCount < 2 && !(isApiError(error) && error.status === 404);
}

/** `GET /incomes/:id` — used by the income form when editing. */
export function useIncomeDetail(id: string) {
  return useQuery({
    queryKey: ['incomes', id],
    queryFn: () => getIncome(id),
    enabled: Boolean(id),
    retry: retryMovement,
  });
}

/** `GET /expenses/:id` — used by the expense form when editing. */
export function useExpenseDetail(id: string) {
  return useQuery({
    queryKey: ['expenses', id],
    queryFn: () => getExpense(id),
    enabled: Boolean(id),
    retry: retryMovement,
  });
}

/**
 * `GET /incomes/:id` or `GET /expenses/:id` depending on the movement kind.
 * The detail screen already knows the kind from the list navigation params.
 */
export function useMovementDetail(kind: MovementKind, id: string) {
  return useQuery<Income | Expense>({
    queryKey: [kind === 'income' ? 'incomes' : 'expenses', id],
    queryFn: () => (kind === 'income' ? getIncome(id) : getExpense(id)),
    enabled: Boolean(id),
    retry: retryMovement,
  });
}
