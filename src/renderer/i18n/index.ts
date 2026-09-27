import { vi } from './vi';
import { en } from './en';
import { zh } from './zh';

export type I18nLocale = 'vi' | 'en' | 'zh';

const dictionaries = {
  vi,
  en,
  zh,
};

export function getDictionary(locale: I18nLocale = 'vi') {
  return dictionaries[locale] || dictionaries.vi;
}
