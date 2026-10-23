import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { radii, useThemeColors } from '@/theme';

import { Button } from './Button';
import type { SelectOption } from './Select';
import { SelectTrigger } from './SelectTrigger';
import { Sheet } from './Sheet';

/** Height of a single wheel row (Apple pickers use ~32 pt; 44 dp is comfier). */
const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const VIEWPORT_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const VERTICAL_PADDING = (VIEWPORT_HEIGHT - ITEM_HEIGHT) / 2;
/** Identical copies of the options; the wheel teleports between them. */
const LOOP_COPIES = 5;
/** Wait for a possible momentum start before snapping a released drag by hand. */
const SETTLE_DELAY = 100;
/** Sub-pixel offsets are already aligned; do not snap them again. */
const SNAP_THRESHOLD = 0.5;

interface WheelItemProps {
  index: number;
  label: string;
  scrollY: SharedValue<number>;
  color: string;
}

/** One wheel row: it rotates and fades with its distance to the center band. */
function WheelItem({ index, label, scrollY, color }: WheelItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const distance = (index * ITEM_HEIGHT - scrollY.value) / ITEM_HEIGHT;
    const absolute = Math.abs(distance);
    const rotateX = interpolate(distance, [-2, 0, 2], [56, 0, -56], Extrapolation.CLAMP);
    const opacity = interpolate(absolute, [0, 1, 2, 2.5], [1, 0.72, 0.32, 0.18], Extrapolation.CLAMP);
    const scale = interpolate(absolute, [0, 1, 2, 2.5], [1, 0.94, 0.86, 0.8], Extrapolation.CLAMP);

    return {
      opacity,
      transform: [{ perspective: 900 }, { rotateX: `${rotateX}deg` }, { scale }],
    };
  });

  return (
    <Animated.View style={[styles.item, animatedStyle]}>
      <Text numberOfLines={1} style={[styles.itemLabel, { color }]}>
        {label}
      </Text>
    </Animated.View>
  );
}

interface WheelProps<T extends string> {
  options: SelectOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  visible: boolean;
}

/**
 * Infinite snapping wheel (F07/F10): the options are repeated in identical
 * copies, so the user can keep spinning forever, and the wheel silently jumps
 * to the middle copy when it nears either end.
 */
function Wheel<T extends string>({ options, value, onChange, visible }: WheelProps<T>) {
  const colors = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useSharedValue(0);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const count = options.length;
  const middleStart = Math.floor(LOOP_COPIES / 2) * count;

  const loopItems = useMemo(() => {
    if (count === 0) {
      return [];
    }

    return Array.from({ length: count * LOOP_COPIES }, (_, absolute) => ({
      key: String(absolute),
      option: options[absolute % count],
    }));
  }, [count, options]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const cancelScheduledSettle = useCallback(() => {
    if (settleTimer.current) {
      clearTimeout(settleTimer.current);
      settleTimer.current = null;
    }
  }, []);

  const settle = useCallback(
    (offsetY: number) => {
      if (count === 0) {
        return;
      }

      const absolute = Math.round(offsetY / ITEM_HEIGHT);
      const index = ((absolute % count) + count) % count;
      const option = options[index];

      if (option && option.value !== value) {
        onChange(option.value);
      }

      if (absolute < count || absolute >= (LOOP_COPIES - 1) * count) {
        scrollRef.current?.scrollTo({ y: (middleStart + index) * ITEM_HEIGHT, animated: false });
        return;
      }

      const targetY = absolute * ITEM_HEIGHT;

      if (Math.abs(offsetY - targetY) > SNAP_THRESHOLD) {
        scrollRef.current?.scrollTo({ y: targetY, animated: true });
      }
    },
    [count, middleStart, onChange, options, value],
  );

  const scrollToValue = useCallback(() => {
    const index = options.findIndex((option) => option.value === value);

    if (index < 0) {
      return;
    }

    scrollRef.current?.scrollTo({ y: (middleStart + index) * ITEM_HEIGHT, animated: false });
  }, [middleStart, options, value]);

  const latestWheel = useRef({ value, options, middleStart });

  useEffect(() => {
    latestWheel.current = { value, options, middleStart };
  }, [middleStart, options, value]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    // Only reposition when the sheet opens: reacting to `value` changes would
    // teleport the wheel while it is still animating towards the snapped row.
    const frame = requestAnimationFrame(() => {
      const current = latestWheel.current;
      const index = current.options.findIndex((option) => option.value === current.value);

      if (index < 0) {
        return;
      }

      scrollRef.current?.scrollTo({
        y: (current.middleStart + index) * ITEM_HEIGHT,
        animated: false,
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [visible]);

  useEffect(() => cancelScheduledSettle, [cancelScheduledSettle]);

  const scheduleSettle = useCallback(
    (offsetY: number) => {
      cancelScheduledSettle();
      // A released drag without momentum still triggers a delayed settle.
      settleTimer.current = setTimeout(() => {
        settleTimer.current = null;
        settle(offsetY);
      }, SETTLE_DELAY);
    },
    [cancelScheduledSettle, settle],
  );

  return (
    <View style={styles.wheel}>
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        bounces={false}
        contentContainerStyle={styles.wheelContent}
        onContentSizeChange={scrollToValue}
        onScrollBeginDrag={cancelScheduledSettle}
        onScrollEndDrag={(event) => scheduleSettle(event.nativeEvent.contentOffset.y)}
        onMomentumScrollBegin={cancelScheduledSettle}
        onMomentumScrollEnd={(event) => {
          cancelScheduledSettle();
          settle(event.nativeEvent.contentOffset.y);
        }}
      >
        {loopItems.map((item, absolute) => (
          <WheelItem
            key={item.key}
            index={absolute}
            label={item.option.label}
            scrollY={scrollY}
            color={colors.text}
          />
        ))}
      </Animated.ScrollView>
      <View pointerEvents="none" style={[styles.selection, { backgroundColor: colors.fill }]} />
    </View>
  );
}

export interface WheelSelectProps<T extends string> {
  label: string;
  value?: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  showSeparator?: boolean;
}

/**
 * Select row for long option lists (days of the month, hours, year months…):
 * it opens a bottom sheet with an Apple-style infinite wheel instead of the
 * flat `Select` list, which cannot show dozens of options at once.
 */
function WheelSelectBase<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Seleccionar',
  showSeparator,
}: WheelSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <>
      <SelectTrigger
        label={label}
        selected={selected?.label}
        placeholder={placeholder}
        showSeparator={showSeparator}
        onPress={() => setOpen(true)}
      />
      <Sheet
        visible={open}
        onClose={() => setOpen(false)}
        title={label}
        enableContentPanningGesture={false}
      >
        <Wheel options={options} value={value} onChange={onChange} visible={open} />
        <Button title="Listo" onPress={() => setOpen(false)} style={styles.done} />
      </Sheet>
    </>
  );
}

export const WheelSelect = Object.assign(WheelSelectBase, { isGroupItem: true as const });

const styles = StyleSheet.create({
  wheel: {
    height: VIEWPORT_HEIGHT,
    overflow: 'hidden',
  },
  wheelContent: {
    paddingVertical: VERTICAL_PADDING,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '500',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  selection: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: VERTICAL_PADDING,
    height: ITEM_HEIGHT,
    borderRadius: radii.segmented,
  },
  done: {
    marginTop: 16,
  },
});
