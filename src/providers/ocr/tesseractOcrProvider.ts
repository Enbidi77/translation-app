import { createWorker } from 'tesseract.js';
import path from 'path';
import fs from 'fs';
import { IOCRProvider } from '../types';
import { OCRResult } from '../../shared/types';
import { PinyinService } from '../translation/pinyinService';

export class TesseractOcrProvider implements IOCRProvider {
  public name = 'tesseract';
  private worker: any = null;
  private currentLang: string = 'chi_sim';

  public isAvailable(): boolean {
    return true; // Local Tesseract is always available
  }

  private cleanLangName(lang: string): string {
    if (lang.includes('chi')) return 'chi_sim';
    if (lang.includes('vie')) return 'vie';
    if (lang.includes('jpn')) return 'jpn';
    if (lang.includes('kor')) return 'kor';
    return 'eng';
  }

  private async getWorker(requestedLang = 'chi_sim') {
    const lang = this.cleanLangName(requestedLang);

    if (!this.worker || this.currentLang !== lang) {
      if (this.worker) {
        try {
          await this.worker.terminate();
        } catch (e) {
          console.warn('[TesseractOCR] Worker terminate error:', e);
        }
        this.worker = null;
      }

      this.currentLang = lang;

      // Determine persistent cache directory in AppData / UserData
      const cacheDir = process.env.APPDATA 
        ? path.join(process.env.APPDATA, 'polyglot-desktop', 'tessdata')
        : path.join(process.cwd(), 'tessdata');

      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      this.worker = await createWorker(lang, undefined, {
        cachePath: cacheDir,
        logger: (m: any) => {
          if (m?.status === 'downloading' && m?.progress !== undefined) {
            console.log(`[TesseractOCR] Downloading ${lang} model: ${(m.progress * 100).toFixed(0)}%`);
          }
        },
      });
    }

    return this.worker;
  }

  public async recognize(imageBuffer: Buffer | string, options?: { lang?: string }): Promise<OCRResult> {
    const lang = options?.lang || 'chi_sim';

    // Ensure image is converted to Buffer for reliable Node recognition
    let finalBuffer: Buffer;
    if (typeof imageBuffer === 'string') {
      if (imageBuffer.startsWith('data:')) {
        const base64Str = imageBuffer.split(',')[1];
        finalBuffer = Buffer.from(base64Str, 'base64');
      } else {
        finalBuffer = Buffer.from(imageBuffer, 'base64');
      }
    } else {
      finalBuffer = imageBuffer;
    }

    try {
      const worker = await this.getWorker(lang);
      const ret = await worker.recognize(finalBuffer);
      const text = (ret?.data?.text || '').trim();

      // Safely extract lines (in Tesseract v7, ret.data.lines may be undefined)
      let lines: Array<{ text: string; bbox?: { x0: number; y0: number; x1: number; y1: number } }> = [];
      if (Array.isArray(ret?.data?.lines)) {
        lines = ret.data.lines
          .map((l: any) => ({
            text: (l.text || '').trim(),
            bbox: l.bbox ? {
              x0: l.bbox.x0,
              y0: l.bbox.y0,
              x1: l.bbox.x1,
              y1: l.bbox.y1,
            } : undefined,
          }))
          .filter((l: any) => l.text.length > 0);
      } else if (text) {
        lines = text
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0)
          .map((line: string) => ({ text: line }));
      }

      const detectedLang = PinyinService.isChinese(text) ? 'zh' : 'en';

      return {
        text,
        confidence: ret?.data?.confidence || 90,
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
      try {
        await this.worker.terminate();
      } catch {}
      this.worker = null;
    }
  }
}
