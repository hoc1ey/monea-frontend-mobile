import { Wallet } from 'lucide-react-native';

import { EmptyState, LargeHeader, ScreenContainer } from '@/components/ui';
import { formatDate } from '@/lib/format';

function todayLabel(): string {
  const label = formatDate(new Date(), "EEEE, d 'de' MMMM");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function HomeScreen() {
  return (
    <ScreenContainer>
      <LargeHeader kicker={todayLabel()} title="Inicio" />
      <EmptyState
        icon={Wallet}
        title="Todo listo para empezar"
        message="Aquí verás tu saldo total, tus tarjetas y las cuotas de la semana."
      />
    </ScreenContainer>
  );
}
