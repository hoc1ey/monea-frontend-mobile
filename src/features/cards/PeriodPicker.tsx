import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Calendar } from 'lucide-react-native';

import type { SelectOption } from '@/components/ui';
import { Button, Group, Row, Sheet, Wheel } from '@/components/ui';
import { longPeriodLabel, shortMonthLabel } from '@/lib/format';
import { detectTimezone } from '@/lib/timezone';
import { useAuthStore } from '@/stores/auth';

import { buildPeriodRange, currentPeriodInTimezone } from './periods';

interface PeriodPickerProps {
  value: string;
  onChange: (period: string) => void;
}

/**
 * Statement period selector (F07/F18): a row showing the selected month and
 * year next to a calendar icon; pressing it opens a bottom sheet with an
 * infinite wheel of month/year periods.
 */
export function PeriodPicker({ value, onChange }: PeriodPickerProps) {
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(value);
  const timezone = useAuthStore((state) => state.user?.timezone) ?? detectTimezone();

  const options: SelectOption<string>[] = buildPeriodRange(
    currentPeriodInTimezone(timezone),
  ).map((period) => ({
    value: period,
    label: `${shortMonthLabel(period)} ${period.slice(0, 4)}`,
  }));

  const open = () => {
    setDraft(value);
    setVisible(true);
  };

  const confirm = () => {
    onChange(draft);
    setVisible(false);
  };

  return (
    <>
      <View style={{ marginVertical: 8 }}>
        <Group>
          <Row
            icon={Calendar}
            title={longPeriodLabel(value)}
            accessibilityLabel="Elegir periodo"
            onPress={open}
          />
        </Group>
      </View>
      <Sheet
        visible={visible}
        onClose={() => setVisible(false)}
        title="Elegir periodo"
        enableContentPanningGesture={false}
      >
        <Wheel options={options} value={draft} onChange={setDraft} visible={visible} />
        <Button title="Listo" onPress={confirm} style={styles.done} />
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  done: {
    marginTop: 16,
  },
});
