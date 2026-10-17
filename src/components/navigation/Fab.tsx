import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';

import { Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ICON_STROKE, elevation, radii, useThemeColors } from '@/theme';

export interface FabProps {
  onPress: () => void;
}

/**
 * Floating action button (prototype `.fab`): 56 × 56, 18 dp radius, accent
 * background. Placed at `insets.bottom + 88` so it sits above the tab bar.
 */
export function Fab({ onPress }: FabProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const right = Math.max(20, (width - 430) / 2 + 16);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Nuevo"
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        {
          bottom: insets.bottom + 88,
          right,
          backgroundColor: colors.accent,
          shadowColor: colors.accent,
          elevation: elevation.fab,
        },
        pressed && styles.pressed,
      ]}
    >
      <Plus size={26} color={colors.onAccent} strokeWidth={ICON_STROKE} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
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
