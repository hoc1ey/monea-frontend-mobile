import { LogOut, Smartphone } from 'lucide-react-native';
import { router } from 'expo-router';

import { signOut, signOutAll } from '@/auth/session';
import { Group, LargeHeader, Row, ScreenContainer, SectionHeader } from '@/components/ui';

export default function MoreScreen() {
  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  const handleSignOutAll = async () => {
    await signOutAll();
    router.replace('/login');
  };

  return (
    <ScreenContainer>
      <LargeHeader title="Más" subtitle="Cuentas y ajustes" />
      <SectionHeader title="Cuenta" />
      <Group>
        <Row icon={LogOut} title="Cerrar sesión" onPress={handleSignOut} />
        <Row icon={Smartphone} title="Cerrar todas las sesiones" onPress={handleSignOutAll} />
      </Group>
    </ScreenContainer>
  );
}
