import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { typography, useIsDark, useThemeColors } from '@/theme';

import { BackButton } from './BackButton';
import { LoadingOverlay } from './LoadingOverlay';

export interface TopBarProps {
  title?: string;
  onBack?: () => void;
  /** Defaults to `true` when `onBack` is provided. */
  showBack?: boolean;
  right?: ReactNode;
  /** Blocks the whole screen while a bar action is calling the API. */
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Sticky glass navigation bar: 52 dp + top inset, centered 17/600 title
 * (max 55% width, ellipsized), optional back button and right actions.
 * When `loading` is set, the bar actions are disabled and a translucent
 * full-screen loader prevents interacting with the rest of the view.
 */
export function TopBar({ title, onBack, showBack, right, loading = false, style }: TopBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const isDark = useIsDark();
  const canGoBack = showBack ?? Boolean(onBack);

  return (
    <>
      <View style={[styles.wrap, { height: 52 + insets.top, paddingTop: insets.top }, style]}>
        <BlurView
          intensity={60}
          tint={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.glass }]}
        />
        <View style={[styles.line, { backgroundColor: colors.separator }]} />
        <View style={styles.bar}>
          <View style={styles.side}>
            {canGoBack && onBack ? <BackButton onPress={onBack} disabled={loading} /> : null}
          </View>
          <View pointerEvents="none" style={styles.center}>
            {title ? (
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {title}
              </Text>
            ) : null}
          </View>
          <View
            pointerEvents={loading ? 'none' : 'auto'}
            style={[styles.side, styles.sideRight, loading && styles.busy]}
          >
            {right}
          </View>
        </View>
      </View>
      <LoadingOverlay visible={loading} />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 12,
  },
  side: {
    minWidth: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1,
  },
  sideRight: {
    marginLeft: 'auto',
    justifyContent: 'flex-end',
  },
  busy: {
    opacity: 0.4,
  },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  title: {
    ...typography.barTitle,
    maxWidth: '55%',
  },
});
