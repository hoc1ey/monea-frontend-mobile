import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

export interface ScreenContainerProps {
  children: ReactNode;
  /** Renders the content inside a ScrollView (default) or a plain View. */
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * Page shell: `bg` background, 16 dp horizontal padding and 150 dp bottom
 * padding to leave room for the floating tab bar (CONVENCIONES 1.4).
 */
export function ScreenContainer({
  children,
  scroll = true,
  style,
  contentContainerStyle,
}: ScreenContainerProps) {
  if (!scroll) {
    return <View style={[styles.screen, style]}>{children}</View>;
  }

  return (
    <ScrollView
      style={[styles.flex, style]}
      contentContainerStyle={[styles.screen, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    paddingHorizontal: 16,
    paddingBottom: 150,
  },
});
