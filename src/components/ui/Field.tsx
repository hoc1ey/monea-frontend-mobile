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
  /** Text alignment; entries are right aligned by default (CONVENCIONES 1.3). */
  align?: 'left' | 'right';
  right?: ReactNode;
  /** Accessory rendered after the input (e.g. a visibility toggle), keeping the input editable. */
  rightAccessory?: ReactNode;
  /** Validation message rendered below the field in 13 `negative` (F03). */
  error?: string;
  showSeparator?: boolean;
  style?: StyleProp<ViewStyle>;
}

function FieldBase({
  label,
  align = 'right',
  right,
  rightAccessory,
  error,
  showSeparator,
  style,
  ...inputProps
}: FieldProps) {
  const colors = useThemeColors();

  return (
    <View style={style}>
      <View style={styles.field}>
        {showSeparator ? <Separator /> : null}
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {right ? (
          <View style={styles.right}>{right}</View>
        ) : (
          <>
            <TextInput
              placeholderTextColor={colors.muted}
              {...inputProps}
              style={[styles.input, { color: colors.text, textAlign: align }]}
            />
            {rightAccessory}
          </>
        )}
      </View>
      {error ? <Text style={[styles.error, { color: colors.negative }]}>{error}</Text> : null}
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
  error: {
    ...typography.footnote,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  right: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-end',
  },
});

export const Field = Object.assign(FieldBase, { isGroupItem: true as const });
