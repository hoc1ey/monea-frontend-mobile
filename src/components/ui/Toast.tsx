import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radii, typography, useThemeColors } from '@/theme';

interface ToastContextValue {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>');
  }
  return context;
}

export interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Host for the single top toast (prototype `#toast`). New messages replace the
 * current one. Renders its children and the toast overlay.
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const [animation] = useState(() => new Animated.Value(0));
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (next: string) => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      setMessage(next);
      animation.setValue(0);
      Animated.timing(animation, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      timeout.current = setTimeout(() => {
        Animated.timing(animation, { toValue: 0, duration: 250, useNativeDriver: true }).start(
          ({ finished }) => {
            if (finished) {
              setMessage(null);
            }
          },
        );
      }, 1900);
    },
    [animation],
  );

  useEffect(
    () => () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    },
    [],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wrap,
            {
              top: insets.top + 14,
              opacity: animation,
              transform: [
                {
                  translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[styles.toast, { backgroundColor: colors.text }]}>
            <Text style={[styles.text, { color: colors.bg }]} numberOfLines={1}>
              {message}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 90,
  },
  toast: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: radii.note,
  },
  text: {
    ...typography.kicker,
    fontWeight: '600',
  },
});
