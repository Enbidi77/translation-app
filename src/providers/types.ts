import { 
  TranslationRequest, 
  TranslationResponse, 
  OCRResult, 
  SentenceAnalysis,
  SupportedLanguage 
} from '../shared/types';

export interface ITranslationProvider {
  name: string;
  isAvailable(): boolean;
  translate(request: TranslationRequest): Promise<TranslationResponse>;
  detectLanguage?(text: string): Promise<SupportedLanguage>;
}

export interface IOCRProvider {
  name: string;
  isAvailable(): boolean;
  recognize(imageBuffer: Buffer | string, options?: { lang?: string }): Promise<OCRResult>;
}

export interface IAIProvider {
  name: string;
  isAvailable(): boolean;
  analyzeSentence(sentence: string, targetLang: string, nativeLang: string): Promise<SentenceAnalysis>;
  explainGrammar(text: string, point?: string): Promise<{ explanation: string; examples: string[] }>;
  chat(messages: Array<{ role: string; content: string }>, options?: { topic?: string; level?: string }): Promise<string>;
  evaluatePronunciation(targetText: string, spokenText: string, lang: string): Promise<{
    score: number;
    feedback: string;
    naturalAlternative: string;
    mistakes: string[];
  }>;
}
