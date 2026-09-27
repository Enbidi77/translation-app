import { IOCRProvider } from '../types';
import { OCRResult } from '../../shared/types';
import { TesseractOcrProvider } from './tesseractOcrProvider';
import { GeminiVisionOcrProvider } from './geminiVisionOcrProvider';
import { logger } from '../../main/logging/logger';
import { generateRequestId } from '../../main/logging/log-context';

export class OcrManager {
  private tesseractProvider: TesseractOcrProvider;
  private geminiVisionProvider: GeminiVisionOcrProvider;
  private preferredEngine: 'tesseract' | 'gemini' = 'tesseract';

  constructor() {
    this.tesseractProvider = new TesseractOcrProvider();
    this.geminiVisionProvider = new GeminiVisionOcrProvider();
  }

  public updateConfig(config: { ocrProvider?: 'tesseract' | 'gemini'; geminiApiKey?: string }) {
    if (config.ocrProvider) this.preferredEngine = config.ocrProvider;
    if (config.geminiApiKey !== undefined) this.geminiVisionProvider.setApiKey(config.geminiApiKey);
  }

  public async recognize(imageBuffer: Buffer | string, options?: { lang?: string }): Promise<OCRResult> {
    const requestId = generateRequestId('ocr');
    const startTime = Date.now();

    logger.info('OCR started', {
      category: 'ocr',
      module: 'ocr-service',
      event: 'ocr_started',
      requestId,
      status: 'started',
      metadata: {
        engine: this.preferredEngine,
        language: options?.lang || 'auto',
      },
    });

    try {
      let result: OCRResult;
      let usedEngine = this.preferredEngine;

      if (this.preferredEngine === 'gemini' && this.geminiVisionProvider.isAvailable()) {
        try {
          result = await this.geminiVisionProvider.recognize(imageBuffer, options);
        } catch (err: any) {
          logger.warn('Gemini Vision OCR failed, falling back to Tesseract', {
            category: 'ocr',
            module: 'ocr-service',
            event: 'ocr_fallback',
            requestId,
            error: err,
          });
          usedEngine = 'tesseract';
          result = await this.tesseractProvider.recognize(imageBuffer, options);
        }
      } else {
        result = await this.tesseractProvider.recognize(imageBuffer, options);
      }

      const durationMs = Date.now() - startTime;
      logger.info('OCR completed', {
        category: 'ocr',
        module: 'ocr-service',
        event: 'ocr_completed',
        requestId,
        durationMs,
        status: 'success',
        metadata: {
          engine: usedEngine,
          textBlockCount: result.lines?.length || 0,
          characterCount: result.text?.length || 0,
          confidence: result.confidence,
          detectedLang: result.detectedLang,
        },
      });

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      logger.error('OCR failed', {
        category: 'ocr',
        module: 'ocr-service',
        event: 'ocr_failed',
        requestId,
        durationMs,
        status: 'failed',
        error,
        metadata: {
          engine: this.preferredEngine,
          language: options?.lang,
        },
      });
      throw error;
    }
  }

  public async terminate() {
    await this.tesseractProvider.terminate();
  }
}
