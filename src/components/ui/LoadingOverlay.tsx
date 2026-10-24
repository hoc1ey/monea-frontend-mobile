import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';

import { radii, typography, useThemeColors } from '@/theme';

export interface LoadingOverlayProps {
  visible: boolean;
  /** Optional text shown under the spinner. */
  label?: string;
}

/**
 * Full-screen translucent overlay with a spinner. While visible it blocks every
 * touch on the underlying screen, including the bar actions that triggered the
 * request, and ignores the Android back button.
 */
export function LoadingOverlay({ visible, label = 'Procesando…' }: LoadingOverlayProps) {
  const colors = useThemeColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => undefined}
    >
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        accessibilityViewIsModal
        style={[styles.overlay, { backgroundColor: colors.scrim }]}
      >
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <ActivityIndicator size="large" color={colors.accent} />
          {label ? <Text style={[styles.label, { color: colors.muted }]}>{label}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    minWidth: 120,
    alignItems: 'center',
    gap: 12,
    paddingVertical: 22,
    paddingHorizontal: 24,
    borderRadius: radii.card,
  },
  label: {
    ...typography.footnote,
  },
});
