import type { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { typography, useThemeColors } from '@/theme';

import { Separator } from './Separator';

export interface FieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Text alignment; auth screens use `left` (prototype `.auth-group`). */
  align?: 'left' | 'right';
  right?: ReactNode;
  showSeparator?: boolean;
  style?: StyleProp<ViewStyle>;
}

function FieldBase({
  label,
  align = 'right',
  right,
  showSeparator,
  style,
  ...inputProps
}: FieldProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.field, style]}>
      {showSeparator ? <Separator /> : null}
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      {right ?? (
        <TextInput
          placeholderTextColor={colors.muted}
          {...inputProps}
          style={[styles.input, { color: colors.text, textAlign: align }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  label: {
    ...typography.body,
  },
  input: {
    ...typography.body,
    flex: 1,
    minWidth: 0,
    padding: 0,
  },
});

export const Field = Object.assign(FieldBase, { isGroupItem: true as const });
