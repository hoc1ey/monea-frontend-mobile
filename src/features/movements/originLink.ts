import type { Href } from 'expo-router';

import { getCreditCardReport, getCreditCards, type CreditCard } from '@/api/creditCards';
import {
  getCollection,
  getCollections,
  getDebt,
  getDebts,
  getLoan,
  getLoans,
} from '@/api/obligations';

import type { Movement, MovementSourceType } from './movements';

/** A origin-module destination the movement detail can navigate to. */
export interface OriginLink {
  /** Short button label, e.g. "Ver lista". */
  label: string;
  /** Specific route of the exact record behind the movement. */
  route: Href;
}

/** Label of the origin button per automatic source type. */
const ORIGIN_LABELS: Record<Exclude<MovementSourceType, 'MANUAL'>, string> = {
  RECURRING: 'Ver recurrente',
  CARD_PAYMENT: 'Ver tarjeta',
  LOAN_CREATION: 'Ver préstamo',
  DEBT_PAYMENT: 'Ver deuda',
  SHOPPING_LIST: 'Ver lista',
  COLLECTION_INSTALLMENT: 'Ver cobro',
  LOAN_INSTALLMENT: 'Ver préstamo',
};

/** Label of the origin button, or `null` for manual movements. */
export function originLinkLabel(movement: Movement): string | null {
  if (movement.sourceType === 'MANUAL') {
    return null;
  }
  return ORIGIN_LABELS[movement.sourceType];
}

/**
 * Origin links the movement itself can build: the API exposes the source id on
 * the movement for these sources (`sourceId` is the config/list/loan id).
 */
function directOriginLink(movement: Movement): OriginLink | null {
  const { sourceId } = movement;
  if (!sourceId) {
    return null;
  }

  switch (movement.sourceType) {
    case 'RECURRING':
      return { label: ORIGIN_LABELS.RECURRING, route: `/recurring/${sourceId}` };
    case 'SHOPPING_LIST':
      return { label: ORIGIN_LABELS.SHOPPING_LIST, route: `/shopping/closed/${sourceId}` };
    case 'LOAN_CREATION':
      return { label: ORIGIN_LABELS.LOAN_CREATION, route: `/obligations/prestamos/${sourceId}` };
    default:
      return null;
  }
}

/** Detail shape holding the installments of an obligation, as the API returns. */
interface InstallmentsOwner {
  installments?: { id: string }[];
}

/**
 * Walks the obligation list and opens details until one installment matches
 * the `sourceId` of the movement (installments expose `incomeId`/`expenseId`
 * and each automatic movement stores the installment id in `sourceId`).
 */
async function resolveInstallmentLink(options: {
  list: () => Promise<{ id: string }[]>;
  detail: (id: string) => Promise<unknown>;
  routeTemplate: (id: string) => Href;
  installmentId: string;
  label: string;
}): Promise<OriginLink | null> {
  let items: { id: string }[];
  try {
    items = await options.list();
  } catch {
    return null;
  }

  for (const item of items) {
    try {
      const owner = (await options.detail(item.id)) as InstallmentsOwner;
      if ((owner.installments ?? []).some((installment) => installment.id === options.installmentId)) {
        return { label: options.label, route: options.routeTemplate(item.id) };
      }
    } catch {
      // A missing detail must not abort the search.
    }
  }
  return null;
}

/** Shifts a `YYYY-MM` period by `delta` months. */
export function shiftPeriod(period: string, delta: number): string {
  const [year, month] = period.split('-').map(Number);
  const index = year * 12 + (month - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}

interface CardPeriodMatch {
  cardId: string;
  period: string;
}

/**
 * Finds the card and period whose payment instant equals the movement date:
 * the expense and the payment share the same `paidAt` instant, so the report
 * exposes it and lets us match without a payment-by-id endpoint.
 */
async function resolveCardPeriod(cards: CreditCard[], date: string): Promise<CardPeriodMatch | null> {
  const month = date.slice(0, 7);
  const matches = await Promise.all(
    cards.map(async (card): Promise<CardPeriodMatch | null> => {
      for (let back = 0; back <= 2; back += 1) {
        const period = shiftPeriod(month, -back);
        try {
          const report = await getCreditCardReport(card.id, period);
          if (report.paid && report.paidAt === date) {
            return { cardId: card.id, period };
          }
        } catch {
          // A period without debt or an error: keep looking.
        }
      }
      return null;
    }),
  );

  return matches.find((match) => match !== null) ?? null;
}

/**
 * Resolves where to go from the movement detail:
 * - direct sources use the `sourceId` already on the movement;
 * - installment sources walk their module lists/details to find the installment;
 * - card payments match the statement whose `paidAt` equals the movement date.
 * Returns `null` when there is nothing to link to or a lookup fails.
 */
export async function resolveOriginLink(movement: Movement): Promise<OriginLink | null> {
  const direct = directOriginLink(movement);
  if (direct) {
    return direct;
  }

  const installmentId = movement.sourceId;
  if (!installmentId) {
    return null;
  }

  switch (movement.sourceType) {
    case 'COLLECTION_INSTALLMENT':
      return resolveInstallmentLink({
        list: () => getCollections(),
        detail: (id) => getCollection(id),
        routeTemplate: (id) => `/obligations/cobros/${id}`,
        installmentId,
        label: ORIGIN_LABELS.COLLECTION_INSTALLMENT,
      });
    case 'LOAN_INSTALLMENT':
      return resolveInstallmentLink({
        list: () => getLoans(),
        detail: (id) => getLoan(id),
        routeTemplate: (id) => `/obligations/prestamos/${id}`,
        installmentId,
        label: ORIGIN_LABELS.LOAN_INSTALLMENT,
      });
    case 'DEBT_PAYMENT':
      return resolveInstallmentLink({
        list: () => getDebts(),
        detail: (id) => getDebt(id),
        routeTemplate: (id) => `/obligations/deudas/${id}`,
        installmentId,
        label: ORIGIN_LABELS.DEBT_PAYMENT,
      });
    case 'CARD_PAYMENT': {
      let cards: CreditCard[];
      try {
        cards = await getCreditCards();
      } catch {
        return null;
      }
      const match = await resolveCardPeriod(cards, movement.date);
      return match
        ? { label: ORIGIN_LABELS.CARD_PAYMENT, route: `/cards/${match.cardId}?period=${match.period}` }
        : null;
    }
    default:
      return null;
  }
}
