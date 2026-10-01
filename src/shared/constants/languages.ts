import { SupportedLanguage } from '../types';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string; // International English name
  nativeName: string; // Localized native name
  vietnameseName: string; // Vietnamese name
  flag: string; // Flag emoji
  speechLocale: string; // BCP-47 speech code
  levelFramework?: string; // Standard proficiency framework (HSK, CEFR, JLPT, TOPIK, etc.)
  direction?: 'ltr' | 'rtl';
}

export const POPULAR_LANGUAGES: LanguageInfo[] = [
  {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    vietnameseName: 'Tiếng Việt',
    flag: '🇻🇳',
    speechLocale: 'vi-VN',
    direction: 'ltr',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    vietnameseName: 'Tiếng Anh',
    flag: '🇺🇸',
    speechLocale: 'en-US',
    levelFramework: 'CEFR',
    direction: 'ltr',
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '简体中文',
    vietnameseName: 'Tiếng Trung',
    flag: '🇨🇳',
    speechLocale: 'zh-CN',
    levelFramework: 'HSK',
    direction: 'ltr',
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    vietnameseName: 'Tiếng Nhật',
    flag: '🇯🇵',
    speechLocale: 'ja-JP',
    levelFramework: 'JLPT',
    direction: 'ltr',
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    vietnameseName: 'Tiếng Hàn',
    flag: '🇰🇷',
    speechLocale: 'ko-KR',
    levelFramework: 'TOPIK',
    direction: 'ltr',
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    vietnameseName: 'Tiếng Pháp',
    flag: '🇫🇷',
    speechLocale: 'fr-FR',
    levelFramework: 'DELF/DALF',
    direction: 'ltr',
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    vietnameseName: 'Tiếng Đức',
    flag: '🇩🇪',
    speechLocale: 'de-DE',
    levelFramework: 'Goethe',
    direction: 'ltr',
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    vietnameseName: 'Tiếng Tây Ban Nha',
    flag: '🇪🇸',
    speechLocale: 'es-ES',
    levelFramework: 'DELE',
    direction: 'ltr',
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    vietnameseName: 'Tiếng Nga',
    flag: '🇷🇺',
    speechLocale: 'ru-RU',
    levelFramework: 'TRKI',
    direction: 'ltr',
  },
];

export const LANGUAGE_MAP = new Map<SupportedLanguage, LanguageInfo>(
  POPULAR_LANGUAGES.map((lang) => [lang.code, lang])
);

export function getLanguageInfo(code?: string): LanguageInfo | undefined {
  if (!code) return undefined;
  const norm = code.split('-')[0].toLowerCase() as SupportedLanguage;
  return LANGUAGE_MAP.get(norm);
}

export function getLanguageName(code?: string, inLocale: 'vi' | 'en' | 'native' = 'native'): string {
  if (!code) return '';
  const info = getLanguageInfo(code);
  if (!info) return code;
  if (inLocale === 'vi') return info.vietnameseName;
  if (inLocale === 'en') return info.name;
  return info.nativeName;
}

