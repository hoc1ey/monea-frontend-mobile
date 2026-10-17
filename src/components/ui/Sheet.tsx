import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { StyleSheet, Text, useWindowDimensions } from 'react-native';

import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radii, typography, useThemeColors } from '@/theme';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children?: ReactNode;
}

/**
 * Bottom sheet built on `@gorhom/bottom-sheet` with the prototype look:
 * 28 dp top radius, 38 × 5 grabber, dynamic height capped at 88% of screen.
 */
export function Sheet({ visible, onClose, title, subtitle, children }: SheetProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const modalRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (visible) {
      modalRef.current?.present();
    } else {
      modalRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        style={{ backgroundColor: colors.scrim }}
      />
    ),
    [colors.scrim],
  );

  return (
    <BottomSheetModal
      ref={modalRef}
      onDismiss={onClose}
      enableDynamicSizing
      maxDynamicContentSize={height * 0.88}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={[
        styles.background,
        { backgroundColor: colors.surface },
      ]}
      handleIndicatorStyle={[styles.handle, { backgroundColor: colors.fill }]}
    >
      <BottomSheetView style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 22 }}>
        {title ? <Text style={[styles.title, { color: colors.text }]}>{title}</Text> : null}
        {subtitle ? <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text> : null}
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: {
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
  },
  handle: {
    width: 38,
    height: 5,
    borderRadius: 3,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    ...typography.subhead,
    textAlign: 'center',
    marginBottom: 14,
  },
});
