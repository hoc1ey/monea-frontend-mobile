import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { ArrowUpDown, Home, LayoutGrid, MoreHorizontal } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IconComponent } from '@/components/ui';
import { ICON_STROKE, elevation, radii, useIsDark, useThemeColors } from '@/theme';

interface TabDefinition {
  label: string;
  icon: IconComponent;
}

const TABS: Record<string, TabDefinition> = {
  index: { label: 'Inicio', icon: Home },
  movements: { label: 'Movimientos', icon: ArrowUpDown },
  manage: { label: 'Gestión', icon: LayoutGrid },
  more: { label: 'Más', icon: MoreHorizontal },
};

/**
 * Floating glass tab bar (prototype `.tabbar`): 66 dp tall, 26 dp radius,
 * centered, `insets.bottom + 12` from the bottom edge. Only rendered by the
 * tabs navigator, so it disappears on stacked detail screens.
 */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const isDark = useIsDark();
  const { width } = useWindowDimensions();
  const barWidth = Math.min(398, width - 32);

  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom: insets.bottom + 12 }]}>
      <View
        style={[
          styles.bar,
          {
            width: barWidth,
            borderColor: colors.glassLine,
            backgroundColor: colors.glass,
            elevation: elevation.tabBar,
          },
        ]}
      >
        <BlurView
          intensity={60}
          tint={isDark ? 'dark' : 'light'}
          blurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const tab = TABS[route.name] ?? { label: route.name, icon: Home };
          const Icon = tab.icon;
          const color = focused ? colors.accentInk : colors.muted;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.label}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={styles.tab}
            >
              <TabPill focused={focused}>
                <Icon size={22} color={color} strokeWidth={ICON_STROKE} />
              </TabPill>
              <Text style={[styles.label, { color }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TabPill({ focused, children }: { focused: boolean; children: ReactNode }) {
  const colors = useThemeColors();
  const [progress] = useState(() => new Animated.Value(focused ? 1 : 0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [focused, progress]);

  const backgroundColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 0, 0, 0)', colors.accentSoft],
  });

  return <Animated.View style={[styles.pill, { backgroundColor }]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 40,
  },
  bar: {
    height: 66,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.tabBar,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
  },
  pill: {
    width: 58,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
});
