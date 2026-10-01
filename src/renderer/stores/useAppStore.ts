import { create } from 'zustand';
import { WordToken } from '../../shared/types';

interface AppState {
  // Modal for individual word lookup
  selectedWord: WordToken | null;
  isWordModalOpen: boolean;
  openWordModal: (word: WordToken) => void;
  closeWordModal: () => void;

  // Close Application Confirmation Dialog
  isCloseDialogOpen: boolean;
  openCloseDialog: () => void;
  closeCloseDialog: () => void;

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

  isCloseDialogOpen: false,
  openCloseDialog: () => set({ isCloseDialogOpen: true }),
  closeCloseDialog: () => set({ isCloseDialogOpen: false }),

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
