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
  /**
   * Set to `false` when the content hosts its own native scrollable (e.g. the
   * wheel picker) so every vertical drag goes to it; swipe-down on the grabber
   * still closes the sheet. Defaults to `true` (drag anywhere in the content).
   */
  enableContentPanningGesture?: boolean;
}

/**
 * Bottom sheet built on `@gorhom/bottom-sheet` with the prototype look:
 * 28 dp top radius, 38 × 5 grabber, dynamic height capped at 88% of screen.
 *
 * Only `dismiss()` a modal that was actually presented: in v5.2.14 a dismissal
 * on a never-presented modal wedges its status in `DISMISSING` and every later
 * `present()` silently renders nothing (gorhom/react-native-bottom-sheet#2723).
 */
export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  enableContentPanningGesture = true,
}: SheetProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const modalRef = useRef<BottomSheetModal>(null);
  const presented = useRef(false);

  useEffect(() => {
    if (visible) {
      if (!presented.current) {
        presented.current = true;
        modalRef.current?.present();
      }
      return;
    }

    if (presented.current) {
      presented.current = false;
      modalRef.current?.dismiss();
    }
  }, [visible]);

  const handleDismiss = useCallback(() => {
    presented.current = false;
    onClose();
  }, [onClose]);

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
      onDismiss={handleDismiss}
      enableDynamicSizing
      maxDynamicContentSize={height * 0.88}
      enablePanDownToClose
      enableContentPanningGesture={enableContentPanningGesture}
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
