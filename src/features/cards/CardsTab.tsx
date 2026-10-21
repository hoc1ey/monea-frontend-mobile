import { Pressable, StyleSheet, View } from 'react-native';

import { router } from 'expo-router';
import { CreditCard, WifiOff } from 'lucide-react-native';

import {
  Banner,
  Button,
  CreditCardVisual,
  EmptyState,
  Group,
  Row,
  Skeleton,
} from '@/components/ui';
import { formatMoney } from '@/lib/format';
import { radii, useThemeColors } from '@/theme';

import type { CardsOverview } from './useCardsOverview';

function CardsSkeleton() {
  const colors = useThemeColors();

  return (
    <View>
      <Skeleton height={172} radius={radii.creditCard} />
      <View style={[styles.skeletonGroup, { backgroundColor: colors.surface }]}>
        <Skeleton height={32} />
        <Skeleton height={32} />
      </View>
    </View>
  );
}

/** "Tarjetas" segment: card visuals, debt/credit summary and creation button. */
export function CardsTab({ overview }: { overview: CardsOverview }) {
  const openNew = () => router.push('/cards/new');
  const refresh = () => {
    void overview.refetch();
  };

  if (overview.isLoading) {
    return <CardsSkeleton />;
  }

  if (overview.isError) {
    return (
      <>
        <Banner
          icon={WifiOff}
          title="Sin conexión"
          subtitle="No pudimos cargar tus tarjetas"
          onPress={refresh}
        />
        <Button title="Reintentar" variant="ghost" onPress={refresh} />
      </>
    );
  }

  if (overview.items.length === 0) {
    return (
      <EmptyState
        icon={CreditCard}
        title="Aún no tienes tarjetas"
        message="Registra tu primera tarjeta para controlar tus periodos y cuotas."
        actionLabel="Nueva tarjeta"
        onAction={openNew}
      />
    );
  }

  return (
    <View>
      {overview.items.map((item) => (
        <Pressable
          key={item.card.id}
          accessibilityRole="button"
          accessibilityLabel={item.card.name}
          onPress={() =>
            router.push({ pathname: '/cards/[id]', params: { id: item.card.id } })
          }
          style={styles.cardWrap}
        >
          <CreditCardVisual
            name={item.card.name}
            issuer={item.card.issuer}
            last4={item.card.lastFourDigits}
            color={item.card.color}
            debt={item.debt?.currentDebt}
          />
        </Pressable>
      ))}

      <Group>
        <Row title="Deuda total de tarjetas" value={formatMoney(overview.totalDebt)} />
        <Row title="Cupo disponible total" value={formatMoney(overview.availableTotal)} />
      </Group>
      <View style={styles.newButton}>
        <Button title="Nueva tarjeta" variant="ghost" onPress={openNew} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    marginBottom: 14,
  },
  skeletonGroup: {
    gap: 12,
    padding: 14,
    marginTop: 12,
    borderRadius: radii.card,
  },
  newButton: {
    marginTop: 14,
  },
});
