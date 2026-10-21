import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { typography, useThemeColors } from '@/theme';

import { SelectTrigger } from './SelectTrigger';

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
  const selected = options.find((o) => o.value === value);

  return (
    <View>
      <SelectTrigger
        label={label}
        selected={selected?.label}
        placeholder={placeholder}
        showSeparator={showSeparator}
        onPress={() => setOpen(true)}
      />

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
          onPress={() => setOpen(false)}
        />
        <View style={{ backgroundColor: colors.surface, padding: 16, paddingBottom: 32 }}>
          <Text
            style={[typography.body, { fontWeight: '700', marginBottom: 8, color: colors.text }]}
          >
            {label}
          </Text>
          {options.map((option, index) => (
            <Pressable
              key={option.value}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
              style={[
                { minHeight: 48, justifyContent: 'center' },
                index > 0 && {
                  borderTopWidth: 0.5,
                  borderTopColor: colors.separator,
                },
              ]}
            >
              <Text style={[typography.body, { color: colors.text }]}>
                {option.label}
                {option.value === value ? (
                  <Text style={{ color: colors.accentInk }}>{'  ✓'}</Text>
                ) : null}
              </Text>
            </Pressable>
          ))}
        </View>
      </Modal>
    </View>
  );
}

export const Select = Object.assign(SelectBase, { isGroupItem: true as const });