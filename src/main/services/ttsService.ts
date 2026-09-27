import https from 'https';
import http from 'http';
import { SettingsRepository } from '../../database/repositories/settingsRepository';

export interface TtsRequest {
  text: string;
  lang?: string;
  slow?: boolean;
}

export interface TtsResponse {
  success: boolean;
  audioData?: string; // base64 Data URL (data:audio/mp3;base64,...)
  format?: string;
  lang?: string;
  cached?: boolean;
  error?: string;
}

export class TtsService {
  private static instance: TtsService | null = null;
  private cache: Map<string, string> = new Map();
  private maxCacheSize: number = 300;
  private settingsRepo: SettingsRepository;

  private constructor() {
    this.settingsRepo = new SettingsRepository();
  }

  public static getInstance(): TtsService {
    if (!TtsService.instance) {
      TtsService.instance = new TtsService();
    }
    return TtsService.instance;
  }

  public normalizeLang(lang?: string, text?: string): string {
    const raw = (lang || '').toLowerCase().trim();
    if (raw.startsWith('zh') || raw.includes('chinese') || raw === 'cn') {
      return 'zh-CN';
    }
    if (raw.startsWith('en') || raw.includes('english')) {
      return 'en';
    }
    if (raw.startsWith('vi') || raw.includes('vietnam')) {
      return 'vi';
    }

    // Auto-detect based on text content if language is not explicitly provided
    if (text) {
      if (/[\u4e00-\u9fa5]/.test(text)) {
        return 'zh-CN';
      }
      if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) {
        return 'vi';
      }
    }

    return 'en';
  }

  public async synthesize(request: TtsRequest): Promise<TtsResponse> {
    const text = (request.text || '').trim();
    if (!text) {
      return { success: false, error: 'Empty text provided' };
    }

    const lang = this.normalizeLang(request.lang, text);
    const slow = Boolean(request.slow);
    const cacheKey = `${lang}:${slow ? '1' : '0'}:${text}`;

    // 1. Check in-memory cache
    if (this.cache.has(cacheKey)) {
      return {
        success: true,
        audioData: this.cache.get(cacheKey)!,
        format: 'audio/mp3',
        lang,
        cached: true,
      };
    }

    try {
      const currentSettings = this.settingsRepo.getSettings();
      const provider = currentSettings.providers?.ttsProvider || 'google';

      let audioBuffer: Buffer | null = null;

      // 2. Try OpenAI TTS if configured
      if (provider === 'openai' && currentSettings.providers?.openaiApiKey) {
        try {
          audioBuffer = await this.synthesizeOpenAi(text, currentSettings.providers.openaiApiKey, slow);
        } catch (err) {
          console.warn('[TtsService] OpenAI TTS failed, falling back to Google TTS:', err);
        }
      }

      // 3. Primary high-fidelity: Google Translate TTS (works for zh-CN, en, vi)
      if (!audioBuffer) {
        audioBuffer = await this.synthesizeGoogle(text, lang, slow);
      }

      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error('TTS returned empty audio buffer');
      }

      const dataUrl = `data:audio/mp3;base64,${audioBuffer.toString('base64')}`;

      // Save to cache
      if (this.cache.size >= this.maxCacheSize) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) this.cache.delete(firstKey);
      }
      this.cache.set(cacheKey, dataUrl);

      return {
        success: true,
        audioData: dataUrl,
        format: 'audio/mp3',
        lang,
        cached: false,
      };
    } catch (err: any) {
      console.error('[TtsService] Synthesis error:', err);
      return {
        success: false,
        error: err.message || 'Failed to synthesize speech',
        lang,
      };
    }
  }

  private async synthesizeGoogle(text: string, lang: string, slow: boolean): Promise<Buffer> {
    // If text is short (<= 180 chars), single request
    if (text.length <= 180) {
      return this.fetchGoogleChunk(text, lang, slow);
    }

    // Split text into clauses/sentences of <= 180 chars
    const chunks = this.splitTextIntoChunks(text, 180);
    const buffers: Buffer[] = [];

    for (const chunk of chunks) {
      if (chunk.trim()) {
        const buf = await this.fetchGoogleChunk(chunk.trim(), lang, slow);
        buffers.push(buf);
      }
    }

    return Buffer.concat(buffers);
  }

  private fetchGoogleChunk(chunk: string, lang: string, slow: boolean): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const encoded = encodeURIComponent(chunk);
      const speed = slow ? '&ttsspeed=0.3' : '';
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${lang}&client=tw-ob${speed}`;

      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': 'https://translate.google.com/',
          'Accept': '*/*',
        },
        timeout: 10000,
      };

      const req = https.get(url, options, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Google TTS request failed with status: ${res.statusCode}`));
          return;
        }

        const data: Buffer[] = [];
        res.on('data', (c) => data.push(c));
        res.on('end', () => {
          resolve(Buffer.concat(data));
        });
      });

      req.on('error', (e) => reject(e));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Google TTS request timeout'));
      });
    });
  }

  private async synthesizeOpenAi(text: string, apiKey: string, slow: boolean): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'nova', // clear, natural voice
        speed: slow ? 0.8 : 1.0,
      });

      const options = {
        hostname: 'api.openai.com',
        path: '/v1/audio/speech',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 15000,
      };

      const req = https.request(options, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`OpenAI TTS returned status: ${res.statusCode}`));
          return;
        }
        const data: Buffer[] = [];
        res.on('data', (c) => data.push(c));
        res.on('end', () => resolve(Buffer.concat(data)));
      });

      req.on('error', (e) => reject(e));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('OpenAI TTS request timeout'));
      });

      req.write(postData);
      req.end();
    });
  }

  private splitTextIntoChunks(text: string, maxLen: number): string[] {
    const chunks: string[] = [];
    // Split on sentence boundaries: Chinese/English periods, question marks, exclamation marks, newlines
    const sentences = text.split(/(?<=[。！？.!?\n\r])\s*/);

    let current = '';
    for (const sentence of sentences) {
      if (!sentence) continue;
      if (current.length + sentence.length <= maxLen) {
        current += (current ? ' ' : '') + sentence;
      } else {
        if (current) chunks.push(current);
        // If an individual sentence is still longer than maxLen, split by commas or spaces
        if (sentence.length > maxLen) {
          const subParts = sentence.split(/(?<=[,，;；])\s*/);
          let subCurrent = '';
          for (const part of subParts) {
            if (subCurrent.length + part.length <= maxLen) {
              subCurrent += (subCurrent ? ' ' : '') + part;
            } else {
              if (subCurrent) chunks.push(subCurrent);
              subCurrent = part;
            }
          }
          if (subCurrent) chunks.push(subCurrent);
          current = '';
        } else {
          current = sentence;
        }
      }
    }
    if (current) chunks.push(current);

    return chunks.length > 0 ? chunks : [text];
  }
}
