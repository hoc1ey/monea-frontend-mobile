import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';

import { Field } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { typography, useThemeColors } from '@/theme';

export interface DateFieldProps {
  label: string;
  value: Date;
  onChange: (value: Date) => void;
  showSeparator?: boolean;
}

/**
 * Form row that opens the native date picker (F08). On Android the picker is a
 * dialog; `onValueChange` fires when the user confirms and `onDismiss` when it
 * is cancelled.
 */
function DateFieldBase({ label, value, onChange, showSeparator }: DateFieldProps) {
  const colors = useThemeColors();
  const [show, setShow] = useState(false);
  const display = formatDate(value, 'd MMM yyyy');

  return (
    <>
      <Field
        label={label}
        showSeparator={showSeparator}
        right={
          <View style={styles.right}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${label}: ${display}`}
              onPress={() => setShow(true)}
              style={({ pressed }) => [styles.valueWrap, pressed && styles.pressed]}
            >
              <Text style={[styles.value, { color: colors.accentInk }]}>{display}</Text>
            </Pressable>
          </View>
        }
      />
      {show ? (
        <DateTimePicker
          value={value}
          mode="date"
          onValueChange={(_, date) => {
            setShow(false);
            onChange(date);
          }}
          onDismiss={() => setShow(false)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  right: {
    flex: 1,
    alignItems: 'flex-end',
  },
  valueWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  value: {
    ...typography.body,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.6,
  },
});

export const DateField = Object.assign(DateFieldBase, { isGroupItem: true as const });
