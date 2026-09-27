import { create } from 'zustand';
import { WordToken } from '../../shared/types';

interface AppState {
  // Modal for individual word lookup
  selectedWord: WordToken | null;
  isWordModalOpen: boolean;
  openWordModal: (word: WordToken) => void;
  closeWordModal: () => void;

  // Global Toast
  toastMessage: string | null;
  toastType: 'info' | 'success' | 'warning' | 'error';
  showToast: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  hideToast: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedWord: null,
  isWordModalOpen: false,
  openWordModal: (word) => set({ selectedWord: word, isWordModalOpen: true }),
  closeWordModal: () => set({ selectedWord: null, isWordModalOpen: false }),

  toastMessage: null,
  toastType: 'info',
  showToast: (msg, type = 'info') => {
    set({ toastMessage: msg, toastType: type });
    setTimeout(() => {
      set({ toastMessage: null });
    }, 3500);
  },
  hideToast: () => set({ toastMessage: null }),
}));
