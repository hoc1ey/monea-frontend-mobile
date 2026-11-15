import type { LucideIcon } from 'lucide-react-native';
import {
  ArrowDownCircle,
  ArrowLeftRight,
  ArrowUpCircle,
  CalendarArrowDown,
  CalendarArrowUp,
  CreditCard,
  Handshake,
  Landmark,
  ShoppingCart,
} from 'lucide-react-native';

/**
 * Icon per system concept: money that enters uses an inward arrow, money that
 * leaves an outward one; calendar arrows mark upcoming collections/debts.
 */
export const CONCEPT_ICONS = {
  ingreso: ArrowDownCircle,
  egreso: ArrowUpCircle,
  transferencia: ArrowLeftRight,
  cuenta: Landmark,
  tarjeta: CreditCard,
  cobro: CalendarArrowDown,
  prestamo: Handshake,
  deuda: CalendarArrowUp,
  lista: ShoppingCart,
} satisfies Record<string, LucideIcon>;
