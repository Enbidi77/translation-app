import { ITranslationProvider } from '../types';
import { TranslationRequest, TranslationResponse, SupportedLanguage } from '../../shared/types';
import { PinyinService } from './pinyinService';

export class GoogleTranslateProvider implements ITranslationProvider {
  public name = 'google_free';

  public isAvailable(): boolean {
    return true; // Always available online without API key
  }

  public async detectLanguage(text: string): Promise<SupportedLanguage> {
    if (/[\u3040-\u30ff]/.test(text)) return 'ja';
    if (/[\uac00-\ud7af]/.test(text)) return 'ko';
    if (PinyinService.isChinese(text)) return 'zh';
    if (/[\u0400-\u04ff]/.test(text)) return 'ru';
    if (/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(text)) {
      return 'vi';
    }
    // Default to en or probe via API
    return 'en';
  }

  public async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const { text, sourceLang = 'auto', targetLang } = request;
    if (!text || !text.trim()) {
      return {
        sourceText: text,
        translatedText: '',
        sourceLang: sourceLang === 'auto' ? 'zh' : sourceLang,
        targetLang,
        provider: this.name,
      };
    }

    const sl = sourceLang === 'auto' ? 'auto' : this.mapLangCode(sourceLang);
    const tl = this.mapLangCode(targetLang);

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&dt=rm&q=${encodeURIComponent(text.trim())}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google Translate HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      let translatedText = '';
      if (Array.isArray(data[0])) {
        for (const part of data[0]) {
          if (part && part[0]) {
            translatedText += part[0];
          }
        }
      }

      const detected = (data[2] || (sourceLang === 'auto' ? 'zh' : sourceLang)) as string;
      const detectedLang = this.reverseMapLangCode(detected);

      // Generate Pinyin if Chinese
      let pinyinText: string | undefined;
      let words = undefined;

      if (detectedLang === 'zh' || PinyinService.isChinese(text)) {
        pinyinText = PinyinService.getPinyin(text);
        words = PinyinService.segmentChineseWords(text);
      }

      return {
        sourceText: text,
        translatedText: translatedText.trim(),
        sourceLang: detectedLang,
        targetLang,
        pinyin: pinyinText,
        detectedLang,
        provider: this.name,
        words,
      };
    } catch (err: any) {
      console.warn('[GoogleTranslateProvider] Web API failed, fallback to offline heuristic:', err.message);
      
      // Fallback response
      const isZh = PinyinService.isChinese(text);
      const pinyinText = isZh ? PinyinService.getPinyin(text) : undefined;
      const words = isZh ? PinyinService.segmentChineseWords(text) : undefined;

      return {
        sourceText: text,
        translatedText: `[Chưa thể kết nối máy chủ dịch: ${err.message}]`,
        sourceLang: isZh ? 'zh' : (sourceLang === 'auto' ? 'en' : sourceLang),
        targetLang,
        pinyin: pinyinText,
        words,
        provider: this.name,
      };
    }
  }

  private mapLangCode(lang: string): string {
    switch (lang) {
      case 'zh': return 'zh-CN';
      case 'vi': return 'vi';
      case 'en': return 'en';
      case 'ja': return 'ja';
      case 'ko': return 'ko';
      case 'fr': return 'fr';
      case 'de': return 'de';
      case 'es': return 'es';
      case 'ru': return 'ru';
      default: return lang;
    }
  }

  private reverseMapLangCode(code: string): SupportedLanguage {
    const lower = (code || '').toLowerCase();
    if (lower.startsWith('zh')) return 'zh';
    if (lower.startsWith('vi')) return 'vi';
    if (lower.startsWith('en')) return 'en';
    if (lower.startsWith('ja')) return 'ja';
    if (lower.startsWith('ko')) return 'ko';
    if (lower.startsWith('fr')) return 'fr';
    if (lower.startsWith('de')) return 'de';
    if (lower.startsWith('es')) return 'es';
    if (lower.startsWith('ru')) return 'ru';
    return 'en';
  }
}
