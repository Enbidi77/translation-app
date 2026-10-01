import { vi } from './vi';
import { en } from './en';
import { zh } from './zh';
import { ja } from './ja';
import { ko } from './ko';
import { fr } from './fr';
import { es } from './es';
import { de } from './de';

export type I18nLocale = 'vi' | 'en' | 'zh' | 'ja' | 'ko' | 'fr' | 'es' | 'de';

export const dictionaries = {
  vi,
  en,
  zh,
  ja,
  ko,
  fr,
  es,
  de,
};

export function getDictionary(locale: I18nLocale = 'vi') {
  return dictionaries[locale] || dictionaries.vi;
}
