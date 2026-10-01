import { describe, it, expect } from 'vitest';
import {
  FEATURE_FLAGS,
  isFeatureEnabled,
  getAllFeatureFlags,
  hasGeminiKey,
  hasOpenAiKey,
  hasDeepLKey,
  hasAnyAiKey,
} from '../renderer/featureFlags';
import { AppSettings } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/constants/settings';

function createSettingsWithProviders(providers: Partial<AppSettings['providers']>): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    providers: {
      ...DEFAULT_SETTINGS.providers,
      ...providers,
    },
  };
}

describe('Feature Flags System', () => {
  describe('Default state (No API Keys)', () => {
    const emptySettings = createSettingsWithProviders({
      geminiApiKey: '',
      openaiApiKey: '',
      deeplApiKey: '',
    });

    it('should evaluate all 8 features as disabled by default', () => {
      const flags = getAllFeatureFlags(emptySettings);

      expect(flags.aiTutor).toBe(false);
      expect(flags.voice).toBe(false);
      expect(flags.subtitlesMic).toBe(false);
      expect(flags.practiceSpeaking).toBe(false);
      expect(flags.ocrGeminiVision).toBe(false);
      expect(flags.translationDeepL).toBe(false);
      expect(flags.ttsOpenAI).toBe(false);
      expect(flags.sttWhisper).toBe(false);
    });

    it('should evaluate provider key helpers as false', () => {
      expect(hasGeminiKey(emptySettings)).toBe(false);
      expect(hasOpenAiKey(emptySettings)).toBe(false);
      expect(hasDeepLKey(emptySettings)).toBe(false);
      expect(hasAnyAiKey(emptySettings)).toBe(false);
    });

    it('should treat whitespace-only keys as invalid/disabled', () => {
      const whitespaceSettings = createSettingsWithProviders({
        geminiApiKey: '   \t  \n',
        openaiApiKey: '   ',
        deeplApiKey: '  ',
      });

      expect(hasGeminiKey(whitespaceSettings)).toBe(false);
      expect(hasOpenAiKey(whitespaceSettings)).toBe(false);
      expect(hasDeepLKey(whitespaceSettings)).toBe(false);
      expect(hasAnyAiKey(whitespaceSettings)).toBe(false);

      const flags = getAllFeatureFlags(whitespaceSettings);
      expect(flags.aiTutor).toBe(false);
      expect(flags.voice).toBe(false);
      expect(flags.subtitlesMic).toBe(false);
      expect(flags.practiceSpeaking).toBe(false);
      expect(flags.ocrGeminiVision).toBe(false);
      expect(flags.translationDeepL).toBe(false);
      expect(flags.ttsOpenAI).toBe(false);
      expect(flags.sttWhisper).toBe(false);
    });
  });

  describe('Feature 1-4: Gemini / OpenAI Dual-Key Features', () => {
    it('Feature 1 (aiTutor): enables with Gemini Key OR OpenAI Key', () => {
      const withGemini = createSettingsWithProviders({ geminiApiKey: 'AIzaSy12345' });
      const withOpenAi = createSettingsWithProviders({ openaiApiKey: 'sk-proj-12345' });
      const withoutBoth = createSettingsWithProviders({ geminiApiKey: '', openaiApiKey: '' });

      expect(isFeatureEnabled('aiTutor', withGemini)).toBe(true);
      expect(isFeatureEnabled('aiTutor', withOpenAi)).toBe(true);
      expect(isFeatureEnabled('aiTutor', withoutBoth)).toBe(false);
    });

    it('Feature 2 (voice): enables with Gemini Key OR OpenAI Key', () => {
      const withGemini = createSettingsWithProviders({ geminiApiKey: 'AIzaSy12345' });
      const withOpenAi = createSettingsWithProviders({ openaiApiKey: 'sk-proj-12345' });
      const withoutBoth = createSettingsWithProviders({ geminiApiKey: '', openaiApiKey: '' });

      expect(isFeatureEnabled('voice', withGemini)).toBe(true);
      expect(isFeatureEnabled('voice', withOpenAi)).toBe(true);
      expect(isFeatureEnabled('voice', withoutBoth)).toBe(false);
    });

    it('Feature 3 (subtitlesMic): enables with Gemini Key OR OpenAI Key', () => {
      const withGemini = createSettingsWithProviders({ geminiApiKey: 'AIzaSy12345' });
      const withOpenAi = createSettingsWithProviders({ openaiApiKey: 'sk-proj-12345' });
      const withoutBoth = createSettingsWithProviders({ geminiApiKey: '', openaiApiKey: '' });

      expect(isFeatureEnabled('subtitlesMic', withGemini)).toBe(true);
      expect(isFeatureEnabled('subtitlesMic', withOpenAi)).toBe(true);
      expect(isFeatureEnabled('subtitlesMic', withoutBoth)).toBe(false);
    });

    it('Feature 4 (practiceSpeaking): enables with Gemini Key OR OpenAI Key', () => {
      const withGemini = createSettingsWithProviders({ geminiApiKey: 'AIzaSy12345' });
      const withOpenAi = createSettingsWithProviders({ openaiApiKey: 'sk-proj-12345' });
      const withoutBoth = createSettingsWithProviders({ geminiApiKey: '', openaiApiKey: '' });

      expect(isFeatureEnabled('practiceSpeaking', withGemini)).toBe(true);
      expect(isFeatureEnabled('practiceSpeaking', withOpenAi)).toBe(true);
      expect(isFeatureEnabled('practiceSpeaking', withoutBoth)).toBe(false);
    });
  });

  describe('Feature 5: Gemini Vision OCR', () => {
    it('enables strictly with Gemini Key, not OpenAI or DeepL', () => {
      const withGemini = createSettingsWithProviders({ geminiApiKey: 'AIzaSy12345' });
      const withOpenAiOnly = createSettingsWithProviders({ openaiApiKey: 'sk-proj-12345' });
      const withDeepLOnly = createSettingsWithProviders({ deeplApiKey: 'deepl-key-123' });

      expect(isFeatureEnabled('ocrGeminiVision', withGemini)).toBe(true);
      expect(isFeatureEnabled('ocrGeminiVision', withOpenAiOnly)).toBe(false);
      expect(isFeatureEnabled('ocrGeminiVision', withDeepLOnly)).toBe(false);
    });
  });

  describe('Feature 6: DeepL Translation', () => {
    it('enables strictly with DeepL Key', () => {
      const withDeepL = createSettingsWithProviders({ deeplApiKey: 'deepl-key-123' });
      const withGeminiOnly = createSettingsWithProviders({ geminiApiKey: 'AIzaSy12345' });

      expect(isFeatureEnabled('translationDeepL', withDeepL)).toBe(true);
      expect(isFeatureEnabled('translationDeepL', withGeminiOnly)).toBe(false);
    });
  });

  describe('Feature 7: OpenAI TTS', () => {
    it('enables strictly with OpenAI Key', () => {
      const withOpenAi = createSettingsWithProviders({ openaiApiKey: 'sk-proj-12345' });
      const withGeminiOnly = createSettingsWithProviders({ geminiApiKey: 'AIzaSy12345' });

      expect(isFeatureEnabled('ttsOpenAI', withOpenAi)).toBe(true);
      expect(isFeatureEnabled('ttsOpenAI', withGeminiOnly)).toBe(false);
    });
  });

  describe('Feature 8: Whisper STT (OpenAI)', () => {
    it('enables strictly with OpenAI Key', () => {
      const withOpenAi = createSettingsWithProviders({ openaiApiKey: 'sk-proj-12345' });
      const withGeminiOnly = createSettingsWithProviders({ geminiApiKey: 'AIzaSy12345' });

      expect(isFeatureEnabled('sttWhisper', withOpenAi)).toBe(true);
      expect(isFeatureEnabled('sttWhisper', withGeminiOnly)).toBe(false);
    });
  });

  describe('FEATURE_FLAGS metadata integrity', () => {
    it('contains metadata for all 8 defined features', () => {
      const keys = Object.keys(FEATURE_FLAGS);
      expect(keys).toEqual([
        'aiTutor',
        'voice',
        'subtitlesMic',
        'practiceSpeaking',
        'ocrGeminiVision',
        'translationDeepL',
        'ttsOpenAI',
        'sttWhisper',
      ]);

      keys.forEach((key) => {
        const meta = FEATURE_FLAGS[key as keyof typeof FEATURE_FLAGS];
        expect(meta.id).toBe(key);
        expect(meta.name).toBeDefined();
        expect(meta.description).toBeDefined();
        expect(meta.requiredKeys.length).toBeGreaterThan(0);
        expect(typeof meta.check).toBe('function');
      });
    });
  });
});

