import { IOCRProvider } from '../types';
import { OCRResult } from '../../shared/types';
import { PinyinService } from '../translation/pinyinService';

export class GeminiVisionOcrProvider implements IOCRProvider {
  public name = 'gemini';
  private apiKey: string = '';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
  }

  public isAvailable(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  public setApiKey(key: string) {
    this.apiKey = key;
  }

  public async recognize(imageBuffer: Buffer | string, options?: { lang?: string }): Promise<OCRResult> {
    if (!this.isAvailable()) {
      throw new Error('Chưa cấu hình Gemini API Key cho Vision OCR');
    }

    let base64Data = '';
    let mimeType = 'image/png';

    if (typeof imageBuffer === 'string') {
      if (imageBuffer.startsWith('data:')) {
        const parts = imageBuffer.split(',');
        mimeType = parts[0].split(';')[0].replace('data:', '');
        base64Data = parts[1];
      } else {
        base64Data = imageBuffer;
      }
    } else {
      base64Data = imageBuffer.toString('base64');
    }

    const prompt = `Perform OCR on this image. Extract all text accurately preserving original line breaks.
Return JSON:
{
  "text": "full text",
  "lines": ["line 1", "line 2"]
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini Vision OCR Error: HTTP ${response.status}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) throw new Error('Không nhận được kết quả OCR từ Gemini.');

    const parsed = JSON.parse(candidate);
    const fullText = (parsed.text || '').trim();
    const lines = (parsed.lines || []).map((l: string) => ({ text: l.trim() }));
    const detectedLang = PinyinService.isChinese(fullText) ? 'zh' : 'en';

    return {
      text: fullText,
      confidence: 98,
      lines,
      detectedLang,
    };
  }
}
