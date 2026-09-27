import { SettingsRepository } from '../../database/repositories/settingsRepository';
import { TranslationManager } from '../../providers/translation';
import { PinyinService } from '../../providers/translation/pinyinService';
import { logger } from '../logging/logger';
import { generateRequestId } from '../logging/log-context';

export interface SttTranscribeRequest {
  audioData: string; // base64 or data URI
  mimeType?: string; // audio/webm, audio/wav, audio/ogg, audio/mp4
  sourceLang?: string; // zh-CN, en-US, vi-VN, zh, en, vi
  targetLang?: string; // vi, zh, en
}

export interface SttTranscribeResponse {
  success: boolean;
  transcript?: string;
  translation?: string;
  pinyin?: string;
  error?: string;
  errorCode?: 'NO_API_KEY' | 'STT_FAILED' | 'NETWORK_ERROR' | 'INVALID_AUDIO';
}

export class SttService {
  private static instance: SttService | null = null;
  private settingsRepo: SettingsRepository;
  private transManager: TranslationManager | null = null;

  private constructor() {
    this.settingsRepo = new SettingsRepository();
  }

  public static getInstance(): SttService {
    if (!SttService.instance) {
      SttService.instance = new SttService();
    }
    return SttService.instance;
  }

  public setTranslationManager(tm: TranslationManager) {
    this.transManager = tm;
  }

  public async transcribeAndTranslate(request: SttTranscribeRequest): Promise<SttTranscribeResponse> {
    const requestId = generateRequestId('stt');
    const start = Date.now();

    try {
      let rawBase64 = request.audioData || '';
      if (!rawBase64) {
        return { success: false, error: 'Dữ liệu âm thanh rỗng', errorCode: 'INVALID_AUDIO' };
      }

      // Extract mime type if in data URI
      let detectedMime = request.mimeType || 'audio/webm';
      if (rawBase64.startsWith('data:')) {
        const match = rawBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          detectedMime = match[1];
          rawBase64 = match[2];
        }
      }

      const settings = this.settingsRepo.getSettings();
      const geminiKey = settings.providers?.geminiApiKey?.trim() || process.env.GEMINI_API_KEY?.trim() || '';
      const openaiKey = settings.providers?.openaiApiKey?.trim() || process.env.OPENAI_API_KEY?.trim() || '';
      const sttPref = settings.providers?.sttProvider || 'gemini';

      const sourceLang = request.sourceLang || 'zh-CN';
      const targetLang = request.targetLang || 'vi';

      logger.info('Speech session started', {
        category: 'speech',
        module: 'stt-service',
        event: 'speech_session_started',
        requestId,
        status: 'started',
        metadata: {
          sourceLang,
          targetLang,
          mimeType: detectedMime,
          audioBytesEstimate: Math.round(rawBase64.length * 0.75),
          preferredProvider: sttPref,
        },
      });

      let response: SttTranscribeResponse;

      // 1. If OpenAI Whisper is preferred or Gemini key is absent but OpenAI is present
      if ((sttPref === 'whisper' && openaiKey) || (!geminiKey && openaiKey)) {
        response = await this.transcribeWithWhisper(rawBase64, detectedMime, openaiKey, sourceLang, targetLang);
      } else if (geminiKey) {
        // 2. If Gemini key is available (preferred default)
        response = await this.transcribeWithGemini(rawBase64, detectedMime, geminiKey, settings.providers?.geminiModel || 'gemini-1.5-flash', sourceLang, targetLang);
      } else {
        // 3. Neither key is configured
        response = {
          success: false,
          error: 'Chưa cấu hình API Key. Để sử dụng nhận diện giọng nói thời gian thực trong Electron, vui lòng nhập Gemini API Key (Miễn phí 100%) hoặc OpenAI Key tại trang Cài đặt.',
          errorCode: 'NO_API_KEY',
        };
      }

      const durationMs = Date.now() - start;
      if (response.success) {
        logger.info('Speech session completed', {
          category: 'speech',
          module: 'stt-service',
          event: 'speech_session_completed',
          requestId,
          durationMs,
          status: 'success',
          metadata: {
            sourceLang,
            targetLang,
            transcriptCharacterCount: response.transcript?.length || 0,
            translationCharacterCount: response.translation?.length || 0,
          },
        });
      } else {
        logger.warn('Speech transcription failed', {
          category: 'speech',
          module: 'stt-service',
          event: 'speech_failed',
          requestId,
          durationMs,
          status: 'failed',
          metadata: {
            sourceLang,
            targetLang,
            errorCode: response.errorCode,
            error: response.error,
          },
        });
      }

      return response;
    } catch (err: any) {
      logger.error('Speech transcription encountered uncaught error', {
        category: 'speech',
        module: 'stt-service',
        event: 'speech_failed',
        requestId,
        durationMs: Date.now() - start,
        status: 'failed',
        error: err,
      });
      return {
        success: false,
        error: err.message || 'Lỗi khi xử lý giọng nói',
        errorCode: 'STT_FAILED',
      };
    }
  }

  private async transcribeWithGemini(
    base64Data: string,
    mimeType: string,
    apiKey: string,
    model: string,
    sourceLang: string,
    targetLang: string
  ): Promise<SttTranscribeResponse> {
    const langNames: Record<string, string> = {
      'zh-CN': 'Chinese (Simplified)',
      'zh': 'Chinese',
      'en-US': 'English',
      'en': 'English',
      'vi-VN': 'Vietnamese',
      'vi': 'Vietnamese',
    };

    const srcName = langNames[sourceLang] || sourceLang;
    const tgtName = langNames[targetLang] || targetLang;

    const prompt = `You are a real-time speech interpreter for a desktop language learning application.
The user is speaking in ${srcName}.
Please perform two tasks:
1. Transcribe the spoken audio verbatim in the original script of ${srcName}.
2. Translate the transcribed text accurately into ${tgtName}.
3. If either the source or target is Chinese, provide Pinyin with proper tone marks.

Respond with ONLY valid JSON adhering to this exact format:
{
  "transcript": "Exact spoken text in original language",
  "translation": "Accurate translation in target language",
  "pinyin": "Pinyin with tone marks if Chinese, otherwise empty string"
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini STT API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Gemini không trả về nội dung nhận diện âm thanh.');
    }

    let transcript = '';
    let translation = '';
    let pinyin = '';

    try {
      let cleanJson = candidateText.trim();
      const codeBlockMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        cleanJson = codeBlockMatch[1].trim();
      }
      const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanJson = jsonMatch[0];
      }

      const parsed = JSON.parse(cleanJson);
      transcript = (parsed.transcript || '').trim();
      translation = (parsed.translation || '').trim();
      pinyin = (parsed.pinyin || '').trim();
    } catch {
      transcript = candidateText.trim();
    }

    // Fallback translation if translation was not included in Gemini response
    if (transcript && !translation && this.transManager) {
      try {
        const isoSrc = sourceLang.split('-')[0].toLowerCase() as any;
        const transRes = await this.transManager.translate({
          text: transcript,
          sourceLang: isoSrc,
          targetLang: targetLang as any,
          mode: 'natural',
        });
        translation = transRes.translatedText;
        if (!pinyin) pinyin = transRes.pinyin || '';
      } catch (err) {
        console.warn('[SttService] Fallback translation error:', err);
      }
    }

    if (!pinyin && transcript && /[\u4e00-\u9fa5]/.test(transcript)) {
      pinyin = PinyinService.getPinyin(transcript);
    }

    return {
      success: true,
      transcript,
      translation,
      pinyin,
    };
  }

  private async transcribeWithWhisper(
    base64Data: string,
    mimeType: string,
    apiKey: string,
    sourceLang: string,
    targetLang: string
  ): Promise<SttTranscribeResponse> {
    const buffer = Buffer.from(base64Data, 'base64');
    const ext = mimeType.includes('wav') ? 'wav' : mimeType.includes('ogg') ? 'ogg' : 'webm';
    const blob = new Blob([buffer], { type: mimeType });

    const formData = new FormData();
    formData.append('file', blob, `audio.${ext}`);
    formData.append('model', 'whisper-1');

    const isoLang = sourceLang.split('-')[0].toLowerCase();
    if (isoLang === 'zh' || isoLang === 'en' || isoLang === 'vi') {
      formData.append('language', isoLang);
    }

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI Whisper error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const transcript = (data.text || '').trim();

    // Now translate the transcript
    let translation = '';
    let pinyin = '';

    if (transcript && this.transManager) {
      try {
        const transRes = await this.transManager.translate({
          text: transcript,
          sourceLang: isoLang as any,
          targetLang: targetLang as any,
          mode: 'natural',
        });
        translation = transRes.translatedText;
        pinyin = transRes.pinyin || '';
      } catch (err) {
        console.warn('[SttService] Whisper translation error:', err);
      }
    }

    if (!pinyin && transcript && /[\u4e00-\u9fa5]/.test(transcript)) {
      pinyin = PinyinService.getPinyin(transcript);
    }

    return {
      success: true,
      transcript,
      translation,
      pinyin,
    };
  }
}
