import { ITranslationProvider } from '../types';
import { TranslationRequest, TranslationResponse, SupportedLanguage } from '../../shared/types';
import { GoogleTranslateProvider } from './googleTranslateProvider';
import { PinyinService } from './pinyinService';
import { AiManager } from '../ai';

export class TranslationManager {
  private googleProvider: GoogleTranslateProvider;
  private aiManager: AiManager;
  private preferredProvider: string = 'google_free';

  constructor(aiManager: AiManager) {
    this.googleProvider = new GoogleTranslateProvider();
    this.aiManager = aiManager;
  }

  public setPreferredProvider(provider: string) {
    this.preferredProvider = provider;
  }

  public async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const text = request.text.trim();
    if (!text) {
      return {
        sourceText: '',
        translatedText: '',
        sourceLang: 'zh',
        targetLang: request.targetLang,
        provider: 'none',
      };
    }

    // Default translation with Google free API (reliable, fast, zero config)
    const baseResponse = await this.googleProvider.translate(request);

    // If Chinese source or target, ensure pinyin and word segmentation are present
    if (baseResponse.sourceLang === 'zh' || PinyinService.isChinese(text)) {
      if (!baseResponse.pinyin) {
        baseResponse.pinyin = PinyinService.getPinyin(text);
      }
      if (!baseResponse.words || baseResponse.words.length === 0) {
        baseResponse.words = PinyinService.segmentChineseWords(text);
      }
    }

    // If mode is 'learning', attach sentence analysis
    if (request.mode === 'learning' || request.mode === undefined) {
      try {
        baseResponse.analysis = await this.aiManager.analyzeSentence(
          text,
          baseResponse.sourceLang,
          baseResponse.targetLang
        );
      } catch (e) {
        console.warn('[TranslationManager] Learning analysis skipped:', e);
      }
    }

    return baseResponse;
  }

  public async detectLanguage(text: string): Promise<SupportedLanguage> {
    return await this.googleProvider.detectLanguage(text);
  }
}
