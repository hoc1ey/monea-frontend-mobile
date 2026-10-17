import { Pressable, StyleSheet, Text, View } from 'react-native';

import { router, type Href } from 'expo-router';
import { ArrowDown, ArrowUp, CreditCard, Landmark, ShoppingCart, Wallet } from 'lucide-react-native';

import { IconTile, Sheet, type IconComponent } from '@/components/ui';
import { useUiStore } from '@/stores/ui';
import { radii, typography, useThemeColors } from '@/theme';

interface QuickAction {
  label: string;
  icon: IconComponent;
  href: Href;
}

const ACTIONS: QuickAction[] = [
  { label: 'Ingreso', icon: ArrowDown, href: '/movements/income/new' },
  { label: 'Egreso', icon: ShoppingCart, href: '/movements/expense/new' },
  { label: 'Cuenta', icon: Wallet, href: '/accounts/new' },
  { label: 'Tarjeta', icon: CreditCard, href: '/cards/new' },
  {
    label: 'Cobro',
    icon: ArrowDown,
    href: { pathname: '/obligations/[type]/new', params: { type: 'cobros' } },
  },
  {
    label: 'Préstamo',
    icon: Landmark,
    href: { pathname: '/obligations/[type]/new', params: { type: 'prestamos' } },
  },
  {
    label: 'Deuda',
    icon: ArrowUp,
    href: { pathname: '/obligations/[type]/new', params: { type: 'deudas' } },
  },
  { label: 'Lista', icon: ShoppingCart, href: '/shopping/new' },
];

/**
 * Global "Nuevo" quick-actions sheet (F02). Lists the eight registration entry
 * points in the prototype order; selecting one closes the sheet and navigates.
 */
export function QuickActionsSheet() {
  const visible = useUiStore((state) => state.quickActionsOpen);
  const close = useUiStore((state) => state.closeQuickActions);
  const colors = useThemeColors();

  return (
    <Sheet visible={visible} onClose={close} title="Nuevo" subtitle="¿Qué quieres registrar?">
      <View style={styles.grid}>
        {ACTIONS.map((action) => (
          <Pressable
            key={action.label}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={() => {
              close();
              router.push(action.href);
            }}
            style={({ pressed }) => [
              styles.option,
              { backgroundColor: colors.surface2 },
              pressed && styles.pressed,
            ]}
          >
            <IconTile icon={action.icon} size={36} />
            <Text style={[styles.label, { color: colors.text }]}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: radii.banner,
  },
  label: {
    ...typography.subhead,
    fontWeight: '500',
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.9,
  },
});
