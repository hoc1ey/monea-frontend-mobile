import { create } from 'zustand';

import type { AuthUser } from '@/api/auth';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  setStatus: (status: AuthStatus) => void;
}

/**
 * Client-side session state. Tokens themselves never live here: they stay in
 * `expo-secure-store` (see `src/auth/tokens.ts`).
 */
export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  setUser: (user) => set({ user }),
  setStatus: (status) => set({ status }),
}));
