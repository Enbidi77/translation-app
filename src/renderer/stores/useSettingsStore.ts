import { create } from 'zustand';
import { AppSettings } from '../../shared/types';
import { DEFAULT_SETTINGS } from '../../shared/constants/settings';
import { I18nLocale, getDictionary } from '../i18n';

interface SettingsState {
  settings: AppSettings;
  locale: I18nLocale;
  dict: ReturnType<typeof getDictionary>;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  setLocale: (locale: I18nLocale) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  locale: 'vi',
  dict: getDictionary('vi'),
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      if (window.electronAPI) {
        const loaded = await window.electronAPI.getSettings();
        if (loaded) {
          set({ settings: loaded });
        }
      }
    } catch (err) {
      console.warn('Failed to load settings via IPC:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  updateSettings: async (partial) => {
    try {
      const merged = { ...get().settings, ...partial };
      set({ settings: merged });
      if (window.electronAPI) {
        const saved = await window.electronAPI.saveSettings(partial);
        set({ settings: saved });
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  },

  setLocale: (locale) => {
    set({
      locale,
      dict: getDictionary(locale),
    });
  },
}));
