import { createWorker } from 'tesseract.js';
import { IOCRProvider } from '../types';
import { OCRResult } from '../../shared/types';
import { PinyinService } from '../translation/pinyinService';

export class TesseractOcrProvider implements IOCRProvider {
  public name = 'tesseract';
  private worker: any = null;
  private currentLang: string = 'chi_sim+eng';

  public isAvailable(): boolean {
    return true; // Local Tesseract is always available
  }

  private async getWorker(lang = 'chi_sim+eng') {
    if (!this.worker || this.currentLang !== lang) {
      if (this.worker) {
        await this.worker.terminate();
      }
      this.currentLang = lang;
      this.worker = await createWorker(lang);
    }
    return this.worker;
  }

  public async recognize(imageBuffer: Buffer | string, options?: { lang?: string }): Promise<OCRResult> {
    const lang = options?.lang || 'chi_sim+eng';
    try {
      const worker = await this.getWorker(lang);
      const ret = await worker.recognize(imageBuffer);
      const text = ret.data.text.trim();

      const lines = ret.data.lines.map((l: any) => ({
        text: l.text.trim(),
        bbox: l.bbox ? {
          x0: l.bbox.x0,
          y0: l.bbox.y0,
          x1: l.bbox.x1,
          y1: l.bbox.y1,
        } : undefined,
      })).filter((l: any) => l.text.length > 0);

      const detectedLang = PinyinService.isChinese(text) ? 'zh' : 'en';

      return {
        text,
        confidence: ret.data.confidence || 90,
        lines,
        detectedLang,
      };
    } catch (err: any) {
      console.error('[TesseractOCR] Recognition error:', err);
      throw new Error(`Nhận diện chữ OCR thất bại: ${err.message}`);
    }
  }

  public async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
