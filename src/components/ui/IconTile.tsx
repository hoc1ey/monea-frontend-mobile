import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ICON_STROKE, radii, useThemeColors } from '@/theme';

import type { IconComponent } from './types';

export interface IconTileProps {
  icon: IconComponent;
  /** Tile edge length. Prototype default: 34. */
  size?: number;
  iconSize?: number;
  tone?: 'accent' | 'neutral';
  style?: StyleProp<ViewStyle>;
}

export function IconTile({ icon: Icon, size = 34, iconSize = 18, tone = 'accent', style }: IconTileProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          backgroundColor: tone === 'accent' ? colors.accentSoft : colors.fill,
        },
        style,
      ]}
    >
      <Icon
        size={iconSize}
        color={tone === 'accent' ? colors.accentInk : colors.text}
        strokeWidth={ICON_STROKE}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radii.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
