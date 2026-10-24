import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Device-local flag that remembers `user.mustChangePassword` across cold starts
 * (the refresh endpoint returns tokens only). It is a UX gate, not a secret, so
 * AsyncStorage is enough.
 */
const STORAGE_KEY = 'monea.mustChangePassword';

export async function loadMustChangePasswordFlag(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function saveMustChangePasswordFlag(value: boolean): Promise<void> {
  try {
    if (value) {
      await AsyncStorage.setItem(STORAGE_KEY, '1');
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // The in-memory store still enforces the gate for this session.
  }
}

export async function clearMustChangePasswordFlag(): Promise<void> {
  await saveMustChangePasswordFlag(false);
}

/**
 * In-memory holder for the temporary password the user just typed at login
 * (EMAIL-VERIFY 4.3). It only lives in memory, never in persistent storage,
 * so the forced change-password screen can prefill the "current" field.
 */
let pendingTempPassword: string | null = null;

export function rememberTempPassword(value: string): void {
  pendingTempPassword = value;
}

/** Reads the pending temp password and clears it (single use). */
export function takeTempPassword(): string | null {
  const value = pendingTempPassword;
  pendingTempPassword = null;
  return value;
}

export function forgetTempPassword(): void {
  pendingTempPassword = null;
}
