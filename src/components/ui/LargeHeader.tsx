import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { typography, useThemeColors } from '@/theme';

import { BackButton } from './BackButton';

export interface LargeHeaderProps {
  title: string;
  kicker?: string;
  subtitle?: string;
  right?: ReactNode;
  onBack?: () => void;
  /** Defaults to `true` when `onBack` is provided. */
  showBack?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Large title header (prototype `.lhdr`): optional 44 dp back row, kicker,
 * 34/41 title and 15 muted subtitle, with a bottom-aligned right action.
 */
export function LargeHeader({
  title,
  kicker,
  subtitle,
  right,
  onBack,
  showBack,
  style,
}: LargeHeaderProps) {
  const colors = useThemeColors();
  const canGoBack = showBack ?? Boolean(onBack);

  return (
    <View style={style}>
      {canGoBack && onBack ? (
        <View style={styles.backRow}>
          <BackButton onPress={onBack} />
        </View>
      ) : (
        <View style={styles.topSpace} />
      )}
      <View style={styles.header}>
        <View style={styles.block}>
          {kicker ? <Text style={[styles.kicker, { color: colors.muted }]}>{kicker}</Text> : null}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text> : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backRow: {
    height: 44,
    justifyContent: 'center',
  },
  topSpace: {
    height: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 6,
    paddingBottom: 14,
  },
  block: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    ...typography.kicker,
    marginBottom: 2,
  },
  title: {
    ...typography.largeTitle,
  },
  subtitle: {
    ...typography.subhead,
    marginTop: 4,
  },
  right: {
    alignItems: 'flex-end',
  },
});
