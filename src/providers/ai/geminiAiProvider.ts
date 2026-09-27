import { IAIProvider } from '../types';
import { SentenceAnalysis } from '../../shared/types';
import { AI_PROMPTS } from './prompts';

export class GeminiAiProvider implements IAIProvider {
  public name = 'gemini';
  private apiKey: string = '';
  private model: string = 'gemini-1.5-flash';

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    if (model) this.model = model;
  }

  public isAvailable(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  public setApiKey(key: string) {
    this.apiKey = key;
  }

  public setModel(model: string) {
    this.model = model;
  }

  private async callGemini(prompt: string): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Chưa cấu hình Gemini API Key. Vui lòng vào Cài đặt để nhập API Key.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) throw new Error('Không nhận được phản hồi từ Gemini API.');
    return candidate;
  }

  public async analyzeSentence(sentence: string, targetLang = 'zh', nativeLang = 'vi'): Promise<SentenceAnalysis> {
    const prompt = AI_PROMPTS.sentenceAnalysis(sentence, targetLang, nativeLang);
    const jsonStr = await this.callGemini(prompt);
    try {
      return JSON.parse(jsonStr);
    } catch {
      // Remove any markdown code fence if present
      const clean = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(clean);
    }
  }

  public async explainGrammar(text: string, point?: string): Promise<{ explanation: string; examples: string[] }> {
    const prompt = AI_PROMPTS.grammarAssistant(point ? `${text} (Trọng tâm: ${point})` : text);
    const jsonStr = await this.callGemini(prompt);
    try {
      return JSON.parse(jsonStr);
    } catch {
      const clean = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(clean);
    }
  }

  public async chat(messages: Array<{ role: string; content: string }>, options?: { topic?: string; level?: string }): Promise<string> {
    const prompt = AI_PROMPTS.conversationTutor(options?.topic || 'Hằng ngày', options?.level || 'Trung cấp', messages);
    const fullPrompt = `${prompt}\n\nLịch sử hội thoại:\n${JSON.stringify(messages, null, 2)}`;
    return await this.callGemini(fullPrompt);
  }

  public async evaluatePronunciation(targetText: string, spokenText: string, lang: string) {
    const prompt = AI_PROMPTS.speechEvaluation(targetText, spokenText, lang);
    const jsonStr = await this.callGemini(prompt);
    try {
      return JSON.parse(jsonStr);
    } catch {
      const clean = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(clean);
    }
  }
}
