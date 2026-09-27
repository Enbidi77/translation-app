import { ITranslationProvider } from '../types';
import { TranslationRequest, TranslationResponse, SupportedLanguage } from '../../shared/types';
import { GoogleTranslateProvider } from './googleTranslateProvider';
import { PinyinService } from './pinyinService';
import { AiManager } from '../ai';
import { logger } from '../../main/logging/logger';
import { generateRequestId } from '../../main/logging/log-context';

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

    const requestId = generateRequestId('trans');
    const startTime = Date.now();

    logger.info('Translation started', {
      category: 'translation',
      module: 'translation-service',
      event: 'translation_started',
      requestId,
      status: 'started',
      metadata: {
        sourceLanguage: request.sourceLang || 'auto',
        targetLanguage: request.targetLang,
        characterCount: text.length,
        mode: request.mode || 'standard',
        preferredProvider: this.preferredProvider,
      },
    });

    try {
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
          logger.warn('Learning analysis skipped', {
            category: 'translation',
            module: 'translation-service',
            event: 'learning_analysis_skipped',
            requestId,
            error: e,
          });
        }
      }

      const durationMs = Date.now() - startTime;
      logger.info('Translation completed', {
        category: 'translation',
        module: 'translation-service',
        event: 'translation_completed',
        requestId,
        durationMs,
        status: 'success',
        metadata: {
          sourceLanguage: baseResponse.sourceLang,
          targetLanguage: baseResponse.targetLang,
          characterCount: text.length,
          outputCharacterCount: baseResponse.translatedText.length,
          provider: baseResponse.provider,
        },
      });

      return baseResponse;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      logger.error('Translation failed', {
        category: 'translation',
        module: 'translation-service',
        event: 'translation_failed',
        requestId,
        durationMs,
        status: 'failed',
        error,
        metadata: {
          sourceLanguage: request.sourceLang || 'auto',
          targetLanguage: request.targetLang,
          characterCount: text.length,
          provider: this.preferredProvider,
        },
      });
      throw error;
    }
  }

  public async detectLanguage(text: string): Promise<SupportedLanguage> {
    return await this.googleProvider.detectLanguage(text);
  }
}
