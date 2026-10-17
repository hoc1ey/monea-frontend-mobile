import { create } from 'zustand';

interface UiState {
  /** Whether the "Nuevo" quick-actions sheet is open (F02). */
  quickActionsOpen: boolean;
  openQuickActions: () => void;
  closeQuickActions: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  quickActionsOpen: false,
  openQuickActions: () => set({ quickActionsOpen: true }),
  closeQuickActions: () => set({ quickActionsOpen: false }),
}));
