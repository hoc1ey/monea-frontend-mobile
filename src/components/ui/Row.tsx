import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { ChevronRight } from 'lucide-react-native';

import { ICON_STROKE, typography, useThemeColors } from '@/theme';

import { IconTile } from './IconTile';
import { Separator } from './Separator';
import type { IconComponent } from './types';

export interface RowProps {
  /** Icon rendered inside a 34 dp tile. */
  icon?: IconComponent;
  /** Custom leading node (e.g. colored tile or initials avatar). Takes precedence over `icon`. */
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  /** Right-aligned value (usually an amount). */
  value?: string | number;
  /** Custom right node (Tag, Switch, Button…). Takes precedence over `value`. */
  right?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  showSeparator?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

function RowBase({
  icon,
  leading,
  title,
  subtitle,
  value,
  right,
  onPress,
  showChevron,
  showSeparator,
  disabled,
  style,
  accessibilityLabel,
}: RowProps) {
  const colors = useThemeColors();
  const hasLeading = Boolean(leading || icon);
  const showChevronIcon = Boolean(onPress) && showChevron !== false;

  const content = (
    <>
      {showSeparator ? <Separator inset={hasLeading ? 60 : 14} /> : null}
      {leading ?? (icon ? <IconTile icon={icon} /> : null)}
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.muted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? (value != null ? <Text style={[styles.value, { color: colors.text }]}>{value}</Text> : null)}
      {showChevronIcon ? <ChevronRight size={14} color={colors.muted} strokeWidth={ICON_STROKE} /> : null}
    </>
  );

  if (!onPress) {
    return <View style={[styles.row, style]}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.fill }, style]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.bodyMedium,
  },
  subtitle: {
    ...typography.footnote,
    marginTop: 1,
  },
  value: {
    ...typography.body,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});

export const Row = Object.assign(RowBase, { isGroupItem: true as const });
