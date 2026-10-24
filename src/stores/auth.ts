import { create } from 'zustand';

import type { AuthUser } from '@/api/auth';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  /** `user.mustChangePassword` mirror, persisted across cold starts. */
  mustChangePassword: boolean;
  setUser: (user: AuthUser | null) => void;
  setStatus: (status: AuthStatus) => void;
  setMustChangePassword: (value: boolean) => void;
}

/**
 * Client-side session state. Tokens themselves never live here: they stay in
 * `expo-secure-store` (see `src/auth/tokens.ts`).
 */
export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  mustChangePassword: false,
  setUser: (user) => set({ user }),
  setStatus: (status) => set({ status }),
  setMustChangePassword: (mustChangePassword) => set({ mustChangePassword }),
}));
