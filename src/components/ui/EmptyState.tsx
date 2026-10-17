import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { ICON_STROKE, typography, useThemeColors } from '@/theme';

import { Button } from './Button';
import type { IconComponent } from './types';

export interface EmptyStateProps {
  icon: IconComponent;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, style]}>
      <Icon size={48} color={colors.muted} strokeWidth={ICON_STROKE} />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: colors.muted }]}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button
            title={actionLabel}
            variant="ghost"
            small
            onPress={onAction}
            style={{ alignSelf: 'center' }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  title: {
    ...typography.barTitle,
    marginTop: 12,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
    marginTop: 6,
  },
  action: {
    marginTop: 16,
    alignItems: 'center',
  },
});
