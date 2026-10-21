import { useState } from 'react';
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
    href: { pathname: '/obligations/[tab]/new', params: { tab: 'cobros' } },
  },
  {
    label: 'Préstamo',
    icon: Landmark,
    href: { pathname: '/obligations/[tab]/new', params: { tab: 'prestamos' } },
  },
  {
    label: 'Deuda',
    icon: ArrowUp,
    href: { pathname: '/obligations/[tab]/new', params: { tab: 'deudas' } },
  },
  { label: 'Lista', icon: ShoppingCart, href: '/shopping/new' },
];

interface ActionButtonProps {
  action: QuickAction;
  onPress: () => void;
}

function ActionButton({ action, onPress }: ActionButtonProps) {
  const colors = useThemeColors();
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={styles.cell}
    >
      <View
        style={[
          styles.option,
          { backgroundColor: colors.surface2 },
          pressed && styles.pressed,
        ]}
      >
        <IconTile icon={action.icon} size={36} />
        <Text numberOfLines={1} style={[styles.label, { color: colors.text }]}>
          {action.label}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * Global "Nuevo" quick-actions sheet (F02). Lists the eight registration entry
 * points in the prototype order; selecting one closes the sheet and navigates.
 */
export function QuickActionsSheet() {
  const visible = useUiStore((state) => state.quickActionsOpen);
  const close = useUiStore((state) => state.closeQuickActions);

  return (
    <Sheet visible={visible} onClose={close} title="Nuevo" subtitle="¿Qué quieres registrar?">
      <View style={styles.grid}>
        {ACTIONS.map((action) => (
          <ActionButton
            key={action.label}
            action={action}
            onPress={() => {
              close();
              router.push(action.href);
            }}
          />
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  cell: {
    width: '48.5%',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radii.banner,
  },
  label: {
    ...typography.subhead,
    fontWeight: '500',
    flex: 1,
    marginLeft: 10,
  },
  pressed: {
    opacity: 0.85,
  },
});