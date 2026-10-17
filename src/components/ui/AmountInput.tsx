import { StyleSheet, Text, TextInput, View } from 'react-native';

import { typography, useThemeColors } from '@/theme';

export interface AmountInputProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** Read-only display (e.g. the card payment sheet shows a fixed total). */
  editable?: boolean;
}

/** Centered amount field with a `$` prefix (prototype `.amt-input`). */
export function AmountInput({
  value,
  onChangeText,
  placeholder = '0.00',
  autoFocus,
  editable = true,
}: AmountInputProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.prefix, { color: colors.text }]}>$</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType="decimal-pad"
        inputMode="decimal"
        autoFocus={autoFocus}
        editable={editable}
        style={[styles.input, { color: colors.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 18,
    paddingBottom: 14,
  },
  prefix: {
    ...typography.amountInput,
  },
  input: {
    ...typography.amountInput,
    width: '70%',
    padding: 0,
    textAlign: 'center',
  },
});
