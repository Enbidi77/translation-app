import { IAIProvider } from '../types';
import { SentenceAnalysis } from '../../shared/types';
import { AI_PROMPTS } from './prompts';

export class OpenAiProvider implements IAIProvider {
  public name = 'openai';
  private apiKey: string = '';
  private model: string = 'gpt-4o-mini';

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
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

  private async callOpenAI(messages: Array<{ role: string; content: string }>, jsonMode = true): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Chưa cấu hình OpenAI API Key. Vui lòng vào Cài đặt để nhập API Key.');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.3,
        response_format: jsonMode ? { type: 'json_object' } : undefined,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API Error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  public async analyzeSentence(sentence: string, targetLang = 'zh', nativeLang = 'vi'): Promise<SentenceAnalysis> {
    const prompt = AI_PROMPTS.sentenceAnalysis(sentence, targetLang, nativeLang);
    const content = await this.callOpenAI([
      { role: 'system', content: 'You are an expert language learning analyzer.' },
      { role: 'user', content: prompt },
    ]);
    return JSON.parse(content);
  }

  public async explainGrammar(text: string, point?: string): Promise<{ explanation: string; examples: string[] }> {
    const prompt = AI_PROMPTS.grammarAssistant(point ? `${text} (Trọng tâm: ${point})` : text);
    const content = await this.callOpenAI([
      { role: 'system', content: 'You are an expert language grammar assistant.' },
      { role: 'user', content: prompt },
    ]);
    return JSON.parse(content);
  }

  public async chat(messages: Array<{ role: string; content: string }>, options?: { topic?: string; level?: string }): Promise<string> {
    const systemPrompt = AI_PROMPTS.conversationTutor(options?.topic || 'Hằng ngày', options?.level || 'Trung cấp', messages);
    return await this.callOpenAI([
      { role: 'system', content: systemPrompt },
      ...messages,
    ]);
  }

  public async evaluatePronunciation(targetText: string, spokenText: string, lang: string) {
    const prompt = AI_PROMPTS.speechEvaluation(targetText, spokenText, lang);
    const content = await this.callOpenAI([
      { role: 'system', content: 'You are an expert speech coach.' },
      { role: 'user', content: prompt },
    ]);
    return JSON.parse(content);
  }
}
