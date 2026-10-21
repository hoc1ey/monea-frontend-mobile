import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Plus } from 'lucide-react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { elevation, ICON_STROKE, radii, useThemeColors } from '@/theme';

export interface FabProps {
  onPress: () => void;
}

/**
 * Floating action button.
 * A full-screen box-none overlay positions it above the bottom navigation.
 */
export function Fab({ onPress }: FabProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();

  const right = Number.isFinite(width)
    ? Math.max(20, (width - 430) / 2 + 16)
    : 20;

  return (
    <View pointerEvents="box-none" style={styles.host}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nuevo"
        onPress={onPress}
        style={[
          styles.fab,
          {
            marginRight: right,
            marginBottom: insets.bottom + 90,
            backgroundColor: colors.accent,
            shadowColor: colors.accent,
            elevation: elevation.fab,
          },
        ]}
      >
        <Plus
          size={30}
          color={colors.onAccent}
          strokeWidth={ICON_STROKE}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFill,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: radii.fab,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 41,
  },
});

