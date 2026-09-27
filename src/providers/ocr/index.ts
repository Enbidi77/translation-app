import { IOCRProvider } from '../types';
import { OCRResult } from '../../shared/types';
import { TesseractOcrProvider } from './tesseractOcrProvider';
import { GeminiVisionOcrProvider } from './geminiVisionOcrProvider';

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
    if (this.preferredEngine === 'gemini' && this.geminiVisionProvider.isAvailable()) {
      try {
        return await this.geminiVisionProvider.recognize(imageBuffer, options);
      } catch (err: any) {
        console.warn('[OcrManager] Gemini Vision failed, falling back to Tesseract:', err.message);
      }
    }

    return await this.tesseractProvider.recognize(imageBuffer, options);
  }

  public async terminate() {
    await this.tesseractProvider.terminate();
  }
}
