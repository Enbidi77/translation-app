import { create } from 'zustand';
import { AppSettings } from '../../shared/types';
import { DEFAULT_SETTINGS } from '../../shared/constants/settings';
import { I18nLocale, getDictionary } from '../i18n';
import { ThemeMode, SubtitleThemeMode, THEME_STORAGE_KEY } from '../../shared/design/theme';

interface SettingsState {
  settings: AppSettings;
  locale: I18nLocale;
  dict: ReturnType<typeof getDictionary>;
  themeMode: ThemeMode;
  effectiveTheme: 'dark' | 'light';
  subtitleTheme: SubtitleThemeMode;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setSubtitleTheme: (mode: SubtitleThemeMode) => Promise<void>;
  setLocale: (locale: I18nLocale) => void;
  initTheme: () => () => void;
}

function resolveEffectiveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
}

function applyThemeToDOM(effectiveTheme: 'dark' | 'light') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  }
}

// Initial reading from localStorage to avoid any mismatch
const initialStoredTheme = (
  typeof localStorage !== 'undefined' 
    ? (localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode) || 'dark'
    : 'dark'
);
const initialEffectiveTheme = resolveEffectiveTheme(initialStoredTheme);
applyThemeToDOM(initialEffectiveTheme);

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  locale: 'vi',
  dict: getDictionary('vi'),
  themeMode: initialStoredTheme,
  effectiveTheme: initialEffectiveTheme,
  subtitleTheme: 'follow_app',
  isLoading: false,

  initTheme: () => {
    // 1. Listen for OS media query changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (get().themeMode === 'system') {
        const newEffective = e.matches ? 'dark' : 'light';
        applyThemeToDOM(newEffective);
        set({ effectiveTheme: newEffective });
      }
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    // 2. Listen for multi-window IPC updates
    let unsubIpc: (() => void) | undefined;
    if (window.electronAPI?.onThemeUpdated) {
      unsubIpc = window.electronAPI.onThemeUpdated((payload) => {
        const mode = payload.theme || 'dark';
        const effective = payload.effectiveTheme || resolveEffectiveTheme(mode);
        try {
          localStorage.setItem(THEME_STORAGE_KEY, mode);
        } catch (_) {}
        applyThemeToDOM(effective);
        set((state) => ({
          themeMode: mode,
          effectiveTheme: effective,
          subtitleTheme: (payload.subtitleTheme as SubtitleThemeMode) || state.subtitleTheme,
          settings: {
            ...state.settings,
            general: {
              ...state.settings.general,
              theme: mode,
            },
            subtitles: {
              ...state.settings.subtitles,
              subtitleTheme: (payload.subtitleTheme as SubtitleThemeMode) || state.settings.subtitles.subtitleTheme,
            },
          },
        }));
      });
    }

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      unsubIpc?.();
    };
  },

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      if (window.electronAPI) {
        const loaded = await window.electronAPI.getSettings();
        if (loaded) {
          const loadedTheme = loaded.general?.theme || get().themeMode || 'dark';
          const effective = resolveEffectiveTheme(loadedTheme);
          try {
            localStorage.setItem(THEME_STORAGE_KEY, loadedTheme);
          } catch (_) {}
          applyThemeToDOM(effective);
          set({
            settings: loaded,
            themeMode: loadedTheme,
            effectiveTheme: effective,
            subtitleTheme: loaded.subtitles?.subtitleTheme || 'follow_app',
          });
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
      if (partial.general?.theme) {
        const newTheme = partial.general.theme;
        const newEffective = resolveEffectiveTheme(newTheme);
        try {
          localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        } catch (_) {}
        applyThemeToDOM(newEffective);
        set({
          settings: merged,
          themeMode: newTheme,
          effectiveTheme: newEffective,
        });
      } else {
        set({ settings: merged });
      }

      if (partial.subtitles?.subtitleTheme) {
        set({ subtitleTheme: partial.subtitles.subtitleTheme });
      }

      if (window.electronAPI) {
        const saved = await window.electronAPI.saveSettings(partial);
        set({ settings: saved });
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  },

  setThemeMode: async (mode: ThemeMode) => {
    const effective = resolveEffectiveTheme(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (_) {}
    applyThemeToDOM(effective);
    set((state) => ({
      themeMode: mode,
      effectiveTheme: effective,
      settings: {
        ...state.settings,
        general: {
          ...state.settings.general,
          theme: mode,
        },
      },
    }));

    if (window.electronAPI?.setThemeMode) {
      try {
        await window.electronAPI.setThemeMode(mode);
      } catch (err) {
        console.warn('Failed to broadcast theme via IPC:', err);
      }
    }
  },

  setSubtitleTheme: async (mode: SubtitleThemeMode) => {
    set((state) => ({
      subtitleTheme: mode,
      settings: {
        ...state.settings,
        subtitles: {
          ...state.settings.subtitles,
          subtitleTheme: mode,
        },
      },
    }));

    if (window.electronAPI) {
      await window.electronAPI.saveSettings({
        subtitles: {
          ...get().settings.subtitles,
          subtitleTheme: mode,
        },
      });
    }
  },

  setLocale: (locale) => {
    set({
      locale,
      dict: getDictionary(locale),
    });
  },
}));
