import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { radii, typography, useThemeColors } from '@/theme';

type DialogTone = 'primary' | 'cancel' | 'destructive';

interface DialogButtonProps {
  label: string;
  tone: DialogTone;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Text button of the dialog. The `Pressable` keeps a fixed style (pressing is
 * tracked with local state, since function styles drop padding/background in
 * this project); the inner `View` paints the fill and the label.
 */
function DialogButton({ label, tone, onPress, disabled = false, loading = false }: DialogButtonProps) {
  const colors = useThemeColors();
  const [pressed, setPressed] = useState(false);

  const textColor = tone === 'destructive' ? colors.negative : colors.accentInk;
  const emphasized = tone === 'primary' || tone === 'destructive';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy: loading }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={styles.button}
    >
      <View
        style={[
          styles.buttonInner,
          { backgroundColor: pressed && !disabled ? colors.fill : 'transparent' },
          disabled ? styles.disabled : null,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <Text style={[styles.buttonText, { color: textColor }, emphasized ? styles.buttonTextStrong : null]}>
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  /** `alert`: one action button. `confirm`: cancel + action. */
  mode?: 'alert' | 'confirm';
  confirmLabel?: string;
  cancelLabel?: string;
  /** Paints the action button in `negative`. */
  destructive?: boolean;
  /** Disables both buttons and shows a spinner in the action button. */
  loading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

/**
 * Themed replacement for `Alert.alert` styled after the iOS dialog (centered
 * card, hairline separators and text buttons), using the app palette.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  mode = 'confirm',
  confirmLabel,
  cancelLabel = 'Cancelar',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const colors = useThemeColors();
  const isAlert = mode === 'alert';
  const actionLabel = confirmLabel ?? (isAlert ? 'Aceptar' : 'Confirmar');

  const handleCancel = useCallback(() => {
    if (loading) {
      return;
    }
    onCancel?.();
  }, [loading, onCancel]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <Pressable
          accessible={false}
          style={[styles.backdrop, { backgroundColor: colors.scrim }]}
          onPress={isAlert ? handleCancel : undefined}
        />
        <View
          accessibilityViewIsModal
          style={[styles.card, { backgroundColor: colors.surface }]}
        >
          <View accessible accessibilityRole="alert" style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            {message ? <Text style={[styles.message, { color: colors.muted }]}>{message}</Text> : null}
          </View>

          <View style={[styles.separator, { backgroundColor: colors.separator }]} />

          <View style={styles.actions}>
            {!isAlert ? (
              <>
                <DialogButton label={cancelLabel} tone="cancel" onPress={handleCancel} disabled={loading} />
                <View style={[styles.verticalSeparator, { backgroundColor: colors.separator }]} />
              </>
            ) : null}
            <DialogButton
              label={actionLabel}
              tone={destructive ? 'destructive' : 'primary'}
              onPress={onConfirm}
              disabled={loading}
              loading={loading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export interface ConfirmDialogOptions {
  title: string;
  message?: string;
  /** Defaults to `Aceptar` in `alert` and `Confirmar` in `confirm`. */
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ConfirmRequest {
  options: ConfirmDialogOptions;
  mode: 'alert' | 'confirm';
  resolve: (value: boolean) => void;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
  alert: (options: ConfirmDialogOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

function useConfirmContext(): ConfirmContextValue {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm/useAlert deben usarse dentro de <ConfirmProvider>');
  }
  return context;
}

/** Imperative confirmation dialog: resolves `true` when the action is accepted. */
export function useConfirm(): ConfirmContextValue['confirm'] {
  return useConfirmContext().confirm;
}

/** Imperative alert dialog: resolves when the single button (or back) closes it. */
export function useAlert(): ConfirmContextValue['alert'] {
  return useConfirmContext().alert;
}

export interface ConfirmProviderProps {
  children: ReactNode;
}

/**
 * Hosts a single `ConfirmDialog` for the whole app. Pending requests queue up
 * and are shown one at a time in the order they were requested.
 */
export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [head, setHead] = useState<ConfirmRequest | null>(null);
  const queue = useRef<ConfirmRequest[]>([]);

  const request = useCallback(
    (options: ConfirmDialogOptions, mode: 'alert' | 'confirm') =>
      new Promise<boolean>((resolve) => {
        queue.current.push({ options, mode, resolve });
        if (queue.current.length === 1) {
          setHead(queue.current[0]);
        }
      }),
    [],
  );

  const settle = useCallback((result: boolean) => {
    const current = queue.current.shift();
    current?.resolve(result);
    setHead(queue.current[0] ?? null);
  }, []);

  const value = useMemo<ConfirmContextValue>(
    () => ({
      confirm: (options) => request(options, 'confirm'),
      alert: (options) => request(options, 'alert'),
    }),
    [request],
  );

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog
        visible={head !== null}
        title={head?.options.title ?? ''}
        message={head?.options.message}
        mode={head?.mode ?? 'confirm'}
        confirmLabel={head?.options.confirmLabel}
        cancelLabel={head?.options.cancelLabel}
        destructive={head?.options.destructive}
        onConfirm={() => settle(true)}
        onCancel={() => settle(false)}
      />
    </ConfirmContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  card: {
    width: 300,
    maxWidth: '80%',
    borderRadius: radii.note,
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    ...typography.barTitle,
    textAlign: 'center',
  },
  message: {
    ...typography.footnote,
    textAlign: 'center',
    marginTop: 6,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  verticalSeparator: {
    width: StyleSheet.hairlineWidth,
  },
  button: {
    flex: 1,
  },
  buttonInner: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  buttonText: {
    ...typography.body,
    textAlign: 'center',
  },
  buttonTextStrong: {
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
