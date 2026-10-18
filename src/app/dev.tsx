import { View, StyleSheet } from 'react-native';

import { Redirect, router, type Href } from 'expo-router';

import { Group, LargeHeader, Row, ScreenContainer, SectionHeader, TopBar } from '@/components/ui';
import { useThemeColors } from '@/theme';

interface DevGroup {
  title: string;
  items: { label: string; href: Href }[];
}

const GROUPS: DevGroup[] = [
  {
    title: 'Inicio',
    items: [
      { label: 'Inicio', href: '/' },
      { label: 'Movimientos', href: '/movements' },
      { label: 'Gestión', href: '/manage' },
      { label: 'Más', href: '/more' },
      { label: 'Recordatorios', href: '/reminders' },
    ],
  },
  {
    title: 'Movimientos',
    items: [
      { label: 'Nuevo ingreso', href: '/movements/income/new' },
      { label: 'Nuevo egreso', href: '/movements/expense/new' },
      { label: 'Recurrentes', href: '/recurring' },
      { label: 'Definir monto', href: '/recurring/define-amount' },
    ],
  },
  {
    title: 'Gestión',
    items: [
      { label: 'Cobros', href: { pathname: '/obligations/[tab]', params: { tab: 'cobros' } } },
      { label: 'Préstamos', href: { pathname: '/obligations/[tab]', params: { tab: 'prestamos' } } },
      { label: 'Deudas', href: { pathname: '/obligations/[tab]', params: { tab: 'deudas' } } },
      {
        label: 'Nuevo cobro',
        href: { pathname: '/obligations/[tab]/new', params: { tab: 'cobros' } },
      },
      { label: 'Listas abiertas', href: { pathname: '/shopping/[tab]', params: { tab: 'open' } } },
      {
        label: 'Listas cerradas',
        href: { pathname: '/shopping/[tab]', params: { tab: 'closed' } },
      },
      { label: 'Nueva lista', href: '/shopping/new' },
    ],
  },
  {
    title: 'Más y cuentas',
    items: [
      { label: 'Cuentas', href: '/accounts' },
      { label: 'Tarjetas', href: { pathname: '/accounts', params: { tab: 'cards' } } },
      { label: 'Nueva cuenta', href: '/accounts/new' },
      { label: 'Nueva tarjeta', href: '/cards/new' },
      { label: 'Perfil', href: '/profile' },
      { label: 'Ajustes', href: '/settings' },
      { label: 'Cambiar contraseña', href: '/change-password' },
    ],
  },
];

/** `/dev` — development-only index of every screen (F15). */
export default function DevScreen() {
  const colors = useThemeColors();

  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar title="Vista previa" onBack={() => router.back()} />
      <ScreenContainer>
        <LargeHeader title="Pantallas" subtitle="Índice del prototipo. Navega a cualquier pantalla." />

        {GROUPS.map((group) => (
          <View key={group.title}>
            <SectionHeader title={group.title} />
            <Group>
              {group.items.map((item) => (
                <Row
                  key={item.label}
                  title={item.label}
                  onPress={() => router.push(item.href)}
                />
              ))}
            </Group>
          </View>
        ))}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
