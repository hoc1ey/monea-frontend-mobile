import { Pressable, StyleSheet } from 'react-native';

import { Check } from 'lucide-react-native';

import { radii, useThemeColors } from '@/theme';

export interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

/** Circular 24 dp checkbox with a 44 dp minimum touch target. */
export function Checkbox({ checked, onToggle, disabled, accessibilityLabel }: CheckboxProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      hitSlop={10}
      onPress={onToggle}
      style={[
        styles.box,
        { borderColor: checked ? colors.accent : colors.muted },
        checked && { backgroundColor: colors.accent },
      ]}
    >
      {checked ? <Check size={14} color={colors.white} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 24,
    height: 24,
    borderRadius: radii.checkbox,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
