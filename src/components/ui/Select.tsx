import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Check } from 'lucide-react-native';

import { ICON_STROKE, typography, useThemeColors } from '@/theme';

import { Separator } from './Separator';
import { Sheet } from './Sheet';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export interface SelectProps<T extends string> {
  label: string;
  value?: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  showSeparator?: boolean;
}

/**
 * Field that opens a bottom sheet with the options (prototype `.field select`).
 * The selected value is shown in `accent-ink` with no arrow icon.
 */
function SelectBase<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Seleccionar',
  showSeparator,
}: SelectProps<T>) {
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.field, pressed && { backgroundColor: colors.fill }]}
      >
        {showSeparator ? <Separator /> : null}
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <Text
          numberOfLines={1}
          style={[styles.value, { color: selected ? colors.accentInk : colors.muted }]}
        >
          {selected ? selected.label : placeholder}
        </Text>
      </Pressable>
      <Sheet visible={open} onClose={() => setOpen(false)} title={label}>
        {options.map((option, index) => {
          const active = option.value === value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
              style={[styles.option, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator }]}
            >
              <Text style={[styles.optionLabel, { color: colors.text }]}>{option.label}</Text>
              {active ? <Check size={18} color={colors.accentInk} strokeWidth={ICON_STROKE} /> : null}
            </Pressable>
          );
        })}
      </Sheet>
    </>
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
  value: {
    ...typography.body,
    fontWeight: '500',
    flex: 1,
    minWidth: 0,
    textAlign: 'right',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 56,
    paddingVertical: 12,
  },
  optionLabel: {
    ...typography.body,
    flex: 1,
  },
});

export const Select = Object.assign(SelectBase, { isGroupItem: true as const });
