export type ThemeMode = 'dark' | 'light' | 'system';
export type SubtitleThemeMode = 'follow_app' | 'dark' | 'light' | 'transparent';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceHover: string;
  surfaceActive: string;
  elevated: string;
  border: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryHover: string;
  success: string;
  warning: string;
  destructive: string;
}

export const THEME_PALETTES = {
  dark: {
    background: '#202124',
    surface: '#292a2d',
    surfaceHover: '#303134',
    surfaceActive: '#35363a',
    elevated: '#35363a',
    border: '#3c4043',
    borderSubtle: '#303134',
    textPrimary: '#e8eaed',
    textSecondary: '#bdc1c6',
    textMuted: '#9aa0a6',
    primary: '#8ab4f8',
    primaryHover: '#aecbfa',
    success: '#81c995',
    warning: '#fdd663',
    destructive: '#f28b82',
  },
  light: {
    background: '#f8f9fa',
    surface: '#ffffff',
    surfaceHover: '#f1f3f4',
    surfaceActive: '#e8eaed',
    elevated: '#ffffff',
    border: '#dadce0',
    borderSubtle: '#e8eaed',
    textPrimary: '#202124',
    textSecondary: '#5f6368',
    textMuted: '#80868b',
    primary: '#1a73e8',
    primaryHover: '#1765cc',
    success: '#1e8e3e',
    warning: '#f9ab00',
    destructive: '#d93025',
  },
} as const;

export const THEME_STORAGE_KEY = 'polyglot_theme_mode';
