import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme } from 'nativewind';
import { create } from 'zustand';

/** Theme options offered in Ajustes (CONVENCIONES 1.3). */
export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'monea.themePreference';

interface ThemeState {
  preference: ThemePreference;
  /** `true` once the persisted preference has been loaded from storage. */
  hydrated: boolean;
  setPreference: (preference: ThemePreference) => void;
  hydrate: () => Promise<void>;
}

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

/**
 * Theme preference persisted in AsyncStorage and applied through NativeWind's
 * `colorScheme.set`, so every screen re-renders live without a restart.
 */
export const useThemeStore = create<ThemeState>((set) => ({
  preference: 'system',
  hydrated: false,
  setPreference: (preference) => {
    colorScheme.set(preference);
    set({ preference });
    AsyncStorage.setItem(STORAGE_KEY, preference).catch(() => undefined);
  },
  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const preference = isThemePreference(stored) ? stored : 'system';
      colorScheme.set(preference);
      set({ preference, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
}));
