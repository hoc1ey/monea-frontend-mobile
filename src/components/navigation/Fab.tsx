import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ICON_STROKE, elevation, radii, useThemeColors } from '@/theme';

export interface FabProps {
  onPress: () => void;
}

/**
 * Floating action button (prototype `.fab`): 56 × 56, 18 dp radius, accent
 * background. A full-screen `box-none` overlay aligned with `flex-end` pins it
 * to the bottom-right corner, `insets.bottom + 88` above the tab bar.
 */
export function Fab({ onPress }: FabProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const right = Number.isFinite(width) ? Math.max(20, (width - 430) / 2 + 16) : 20;

  return (
    <View pointerEvents="box-none" style={styles.host}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nuevo"
        onPress={onPress}
        style={({ pressed }) => [
          styles.fab,
          {
            marginRight: right,
            marginBottom: insets.bottom + 88,
            backgroundColor: colors.accent,
            shadowColor: colors.accent,
            elevation: elevation.fab,
          },
          pressed && styles.pressed,
        ]}
      >
        <Plus size={26} color={colors.onAccent} strokeWidth={ICON_STROKE} />
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
    width: 56,
    height: 56,
    borderRadius: radii.fab,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 41,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
});
