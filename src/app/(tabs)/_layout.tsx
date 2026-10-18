import { StyleSheet } from 'react-native';

import { Tabs } from 'expo-router/js-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TabBar } from '@/components/navigation/TabBar';
import { useThemeColors } from '@/theme';

export default function TabsLayout() {
  const colors = useThemeColors();

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
      >
        <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
        <Tabs.Screen name="movements" options={{ title: 'Movimientos' }} />
        <Tabs.Screen name="manage" options={{ title: 'Gestión' }} />
        <Tabs.Screen name="more" options={{ title: 'Más' }} />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
