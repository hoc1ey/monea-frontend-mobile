import { Children, Fragment, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radii, useThemeColors } from '@/theme';

export interface GroupProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Rounded `surface` container for grouped rows/fields (prototype `.group`).
 * Children marked as group items (Row, Field) receive `showSeparator` for all
 * but the first one, reproducing the iOS separator rules.
 */
export function Group({ children, style }: GroupProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.group, { backgroundColor: colors.surface }, style]}>
      {Children.toArray(children).map((child, index) => {
        if (isValidElement(child)) {
          const isItem = Boolean((child.type as { isGroupItem?: boolean } | undefined)?.isGroupItem);

          if (isItem) {
            return cloneElement(child as ReactElement<{ showSeparator?: boolean }>, {
              key: child.key ?? index,
              showSeparator: index > 0,
            });
          }
        }

        return <Fragment key={index}>{child}</Fragment>;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    borderRadius: radii.card,
    overflow: 'hidden',
    marginBottom: 4,
  },
});
