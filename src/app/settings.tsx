import { StyleSheet, View } from 'react-native';

import { router } from 'expo-router';

import {
  Group,
  ScreenContainer,
  SectionHeader,
  Segmented,
  TopBar,
  type SegmentedOption,
} from '@/components/ui';
import { useThemeStore, type ThemePreference } from '@/stores/theme';
import { useThemeColors } from '@/theme';

const THEME_OPTIONS: SegmentedOption<ThemePreference>[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

/** `/settings` — appearance, security and notification settings (F15). */
export default function SettingsScreen() {
  const colors = useThemeColors();
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar title="Ajustes" onBack={() => router.back()} />
      <ScreenContainer>
        <SectionHeader title="Apariencia" />
        <Group>
          <View style={styles.segmentWrap}>
            <Segmented
              options={THEME_OPTIONS}
              value={preference}
              onChange={setPreference}
              style={styles.segment}
            />
          </View>
        </Group>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  segmentWrap: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  segment: {
    marginTop: 0,
    marginBottom: 0,
  },
});
