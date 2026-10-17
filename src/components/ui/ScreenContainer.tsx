import type { ReactElement, ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export interface ScreenContainerProps {
  children: ReactNode;
  /** Renders the content inside a ScrollView (default) or a plain View. */
  scroll?: boolean;
  /** Optional `RefreshControl` for pull-to-refresh (CONVENCIONES 1.7). */
  refreshControl?: ReactElement<RefreshControlProps>;
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
  refreshControl,
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
      refreshControl={refreshControl}
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
