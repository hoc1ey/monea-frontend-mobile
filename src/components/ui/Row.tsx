import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { ChevronRight } from 'lucide-react-native';

import { ICON_STROKE, typography, useThemeColors } from '@/theme';

import { Separator } from './Separator';
import type { IconComponent } from './types';

export interface RowProps {
  icon?: IconComponent;
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  value?: string | number;
  right?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  showSeparator?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

function RowBase({
  icon: Icon,
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
  const hasLeading = Boolean(leading || Icon);
  const showChevronIcon = Boolean(onPress) && showChevron !== false;

  return (
    <View style={styles.wrapper}>
      {showSeparator ? <Separator inset={hasLeading ? 60 : 14} /> : null}

      {/* Fila: siempre un View con flexDirection row, igual a la prueba que funciona */}
      <View style={[styles.row, style]}>
        {leading ? (
          <View style={styles.lead}>{leading}</View>
        ) : Icon ? (
          <View style={[styles.tile, { backgroundColor: colors.accentSoft }]}>
            <Icon size={18} color={colors.accentInk} strokeWidth={ICON_STROKE} />
          </View>
        ) : null}

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

        {showChevronIcon ? (
          <View style={styles.lead}>
            <ChevronRight size={14} color={colors.muted} strokeWidth={ICON_STROKE} />
          </View>
        ) : null}
      </View>

      {/* Capa táctil encima de la fila: no altera el layout */}
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? title}
          disabled={disabled}
          onPress={onPress}
          android_ripple={{ color: colors.fill }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  tile: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  lead: {
    flexShrink: 0,
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
    flexShrink: 0,
  },
});

export const Row = Object.assign(RowBase, { isGroupItem: true as const });