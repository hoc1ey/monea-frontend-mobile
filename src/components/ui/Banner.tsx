import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { ChevronRight } from 'lucide-react-native';

import { ICON_STROKE, radii, typography, useThemeColors } from '@/theme';

import { IconTile } from './IconTile';
import type { IconComponent } from './types';

export interface BannerProps {
  icon: IconComponent;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Soft accent banner with icon tile, title and chevron (prototype `.banner`). */
export function Banner({ icon, title, subtitle, onPress, style }: BannerProps) {
  const colors = useThemeColors();

  const content = (
    <>
      <IconTile icon={icon} />
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.muted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {onPress ? <ChevronRight size={14} color={colors.muted} strokeWidth={ICON_STROKE} /> : null}
    </>
  );

  const containerStyle = [styles.banner, { backgroundColor: colors.accentSoft }, style];

  if (!onPress) {
    return <View style={containerStyle}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [...containerStyle, pressed && { opacity: 0.9 }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.banner,
    marginBottom: 12,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.subhead,
    fontWeight: '600',
  },
  subtitle: {
    ...typography.footnote,
  },
});
