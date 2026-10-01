import { describe, it, expect } from 'vitest';
import { POPULAR_LANGUAGES, getLanguageInfo, getLanguageName } from '../shared/constants/languages';
import { GoogleTranslateProvider } from '../providers/translation/googleTranslateProvider';
import { TtsService } from '../main/services/ttsService';
import { getDictionary, dictionaries, I18nLocale } from '../renderer/i18n';
import { SEED_LANGUAGES } from '../database/seeds/defaultVocabulary';

describe('Popular Languages Extension', () => {
  describe('Constants and Metadata', () => {
    it('should include all 9 popular languages', () => {
      const codes = POPULAR_LANGUAGES.map((l) => l.code);
      expect(codes).toContain('vi');
      expect(codes).toContain('en');
      expect(codes).toContain('zh');
      expect(codes).toContain('ja');
      expect(codes).toContain('ko');
      expect(codes).toContain('fr');
      expect(codes).toContain('de');
      expect(codes).toContain('es');
      expect(codes).toContain('ru');
    });

    it('should correctly lookup language info by code and prefix', () => {
      expect(getLanguageInfo('ja')?.name).toBe('Japanese');
      expect(getLanguageInfo('ja-JP')?.nativeName).toBe('日本語');
      expect(getLanguageInfo('ko-KR')?.flag).toBe('🇰🇷');
      expect(getLanguageInfo('fr')?.speechLocale).toBe('fr-FR');
      expect(getLanguageInfo('invalid')).toBeUndefined();
    });

    it('should return appropriate language names for localized displays', () => {
      expect(getLanguageName('ja', 'vi')).toBe('Tiếng Nhật');
      expect(getLanguageName('ja', 'en')).toBe('Japanese');
      expect(getLanguageName('ja', 'native')).toBe('日本語');
      expect(getLanguageName('de', 'vi')).toBe('Tiếng Đức');
      expect(getLanguageName('es', 'native')).toBe('Español');
    });
  });

  describe('Translation Provider Language Detection & Code Mapping', () => {
    const provider = new GoogleTranslateProvider();

    it('should detect Japanese characters', async () => {
      expect(await provider.detectLanguage('こんにちは世界')).toBe('ja');
      expect(await provider.detectLanguage('カタカナ')).toBe('ja');
    });

    it('should detect Korean Hangul characters', async () => {
      expect(await provider.detectLanguage('안녕하세요')).toBe('ko');
    });

    it('should detect Cyrillic characters as Russian', async () => {
      expect(await provider.detectLanguage('Привет мир')).toBe('ru');
    });

    it('should detect Chinese Hanzi characters', async () => {
      expect(await provider.detectLanguage('你好，我是学生。')).toBe('zh');
    });

    it('should detect Vietnamese diacritics', async () => {
      expect(await provider.detectLanguage('Xin chào các bạn')).toBe('vi');
    });

    it('should map language codes to Google Translate specifications', () => {
      const mapFn = (provider as any).mapLangCode.bind(provider);
      expect(mapFn('zh')).toBe('zh-CN');
      expect(mapFn('vi')).toBe('vi');
      expect(mapFn('en')).toBe('en');
      expect(mapFn('ja')).toBe('ja');
      expect(mapFn('ko')).toBe('ko');
      expect(mapFn('fr')).toBe('fr');
      expect(mapFn('de')).toBe('de');
      expect(mapFn('es')).toBe('es');
      expect(mapFn('ru')).toBe('ru');
    });

    it('should reverse map Google API codes back to SupportedLanguage', () => {
      const revFn = (provider as any).reverseMapLangCode.bind(provider);
      expect(revFn('zh-CN')).toBe('zh');
      expect(revFn('ja')).toBe('ja');
      expect(revFn('ko-KR')).toBe('ko');
      expect(revFn('fr')).toBe('fr');
      expect(revFn('de-DE')).toBe('de');
      expect(revFn('es')).toBe('es');
      expect(revFn('ru')).toBe('ru');
    });
  });

  describe('TTS Service Language Normalization', () => {
    const tts = TtsService.getInstance();

    it('should normalize explicit language codes and names', () => {
      expect(tts.normalizeLang('ja')).toBe('ja');
      expect(tts.normalizeLang('ja-JP')).toBe('ja');
      expect(tts.normalizeLang('japanese')).toBe('ja');
      expect(tts.normalizeLang('ko')).toBe('ko');
      expect(tts.normalizeLang('korean')).toBe('ko');
      expect(tts.normalizeLang('fr')).toBe('fr');
      expect(tts.normalizeLang('french')).toBe('fr');
      expect(tts.normalizeLang('de')).toBe('de');
      expect(tts.normalizeLang('german')).toBe('de');
      expect(tts.normalizeLang('es')).toBe('es');
      expect(tts.normalizeLang('spanish')).toBe('es');
      expect(tts.normalizeLang('ru')).toBe('ru');
      expect(tts.normalizeLang('russian')).toBe('ru');
    });

    it('should auto-detect language from text when language argument is empty', () => {
      expect(tts.normalizeLang(undefined, 'こんにちは')).toBe('ja');
      expect(tts.normalizeLang(undefined, '안녕하세요')).toBe('ko');
      expect(tts.normalizeLang(undefined, 'Здравствуйте')).toBe('ru');
      expect(tts.normalizeLang(undefined, '你好')).toBe('zh-CN');
      expect(tts.normalizeLang(undefined, 'Chào buổi sáng')).toBe('vi');
      expect(tts.normalizeLang(undefined, 'Good morning')).toBe('en');
    });
  });

  describe('i18n UI Localization for Popular Languages', () => {
    const locales: I18nLocale[] = ['vi', 'en', 'zh', 'ja', 'ko', 'fr', 'es', 'de'];

    it('should have dictionaries for all 8 UI locales', () => {
      for (const loc of locales) {
        const dict = getDictionary(loc);
        expect(dict).toBeDefined();
        expect(dict.appName).toBe('PolyglotDesktop');
        expect(dict.sidebar.translate).toBeDefined();
        expect(dict.sidebar.voice).toBeDefined();
        expect(dict.sidebar.settings).toBeDefined();
        expect(dict.translate.title).toBeDefined();
        expect(dict.settings.title).toBeDefined();
        expect(dict.closeDialog.minimizeTitle).toBeDefined();
        expect(dict.closeDialog.exitTitle).toBeDefined();
      }
    });

    it('should fallback to default dictionary on unknown locale', () => {
      const fallback = getDictionary('unknown' as any);
      expect(fallback).toBe(dictionaries.vi);
    });
  });

  describe('Database Seeds', () => {
    it('should include all popular languages in SEED_LANGUAGES', () => {
      const seedCodes = SEED_LANGUAGES.map((l) => l.code);
      expect(seedCodes).toContain('vi');
      expect(seedCodes).toContain('en');
      expect(seedCodes).toContain('zh');
      expect(seedCodes).toContain('ja');
      expect(seedCodes).toContain('ko');
      expect(seedCodes).toContain('fr');
      expect(seedCodes).toContain('de');
      expect(seedCodes).toContain('es');
      expect(seedCodes).toContain('ru');
    });
  });
});
