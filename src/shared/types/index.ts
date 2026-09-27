export type SupportedLanguage = 'vi' | 'zh' | 'en' | 'ja' | 'ko';

export interface UserProfile {
  id: number;
  nativeLanguage: SupportedLanguage;
  primaryTarget: SupportedLanguage;
  secondaryTarget: SupportedLanguage;
}

export type HSKLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface VocabularyItem {
  id?: number;
  word: string;
  language: SupportedLanguage;
  translation: string;
  pinyin?: string;
  ipa?: string;
  partOfSpeech?: string;
  definition?: string;
  difficulty?: number;
  hskLevel?: HSKLevel;
  cefrLevel?: CEFRLevel;
  source?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  easeFactor?: number;
  repetitionCount?: number;
  intervalDays?: number;
  examples?: VocabularyExample[];
}

export interface VocabularyExample {
  id?: number;
  vocabularyId?: number;
  sentence: string;
  pinyin?: string;
  translation: string;
}

export type FlashcardRating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export interface Flashcard {
  id: number;
  vocabularyId: number;
  front: string;
  back: string;
  pinyin?: string;
  note?: string;
  state: 'new' | 'learning' | 'review' | 'mastered';
  interval: number; // in days
  easeFactor: number; // default 2.5
  reps: number;
  lapses: number;
  due: string;
  createdAt: string;
  updatedAt: string;
  vocabulary?: VocabularyItem;
}

export interface ReviewLog {
  id?: number;
  flashcardId: number;
  rating: FlashcardRating;
  reviewTime: number;
  elapsedDays: number;
  scheduledDays: number;
  reviewType: string;
  createdAt?: string;
}

export type TranslationSourceType = 
  | 'screen'
  | 'ocr'
  | 'clipboard'
  | 'voice'
  | 'manual'
  | 'subtitle'
  | 'ai_chat';

export type TranslationQualityMode = 'literal' | 'natural' | 'learning';

export interface TranslationRequest {
  text: string;
  sourceLang?: SupportedLanguage | 'auto';
  targetLang: SupportedLanguage;
  mode?: TranslationQualityMode;
  context?: string;
}

export interface WordToken {
  word: string;
  pinyin?: string;
  translation: string;
  partOfSpeech?: string;
  hskLevel?: number;
  isSaved?: boolean;
}

export interface SentenceAnalysis {
  original: string;
  pinyin?: string;
  literalVi: string;
  naturalVi: string;
  naturalEn: string;
  structure?: {
    subject?: string;
    predicate?: string;
    object?: string;
    adverbial?: string;
    complement?: string;
    particles?: string[];
  };
  grammarPoints?: Array<{
    title: string;
    explanation: string;
    examples: string[];
  }>;
  vietnameseLearnerTips?: {
    commonMistake?: string;
    explanation?: string;
    naturalAlternative?: string;
    naturalnessScore?: 'grammatically_wrong' | 'unnatural' | 'acceptable' | 'very_natural';
  };
  vocabulary: WordToken[];
}

export interface TranslationResponse {
  sourceText: string;
  translatedText: string;
  sourceLang: SupportedLanguage;
  targetLang: SupportedLanguage;
  pinyin?: string;
  ipa?: string;
  provider: string;
  detectedLang?: SupportedLanguage;
  words?: WordToken[];
  analysis?: SentenceAnalysis;
}

export interface OCRResult {
  text: string;
  confidence: number;
  lines: Array<{
    text: string;
    bbox?: { x0: number; y0: number; x1: number; y1: number };
  }>;
  detectedLang?: SupportedLanguage;
}

export interface TranslationHistoryItem {
  id?: number;
  sourceText: string;
  sourceLang: string;
  targetText: string;
  targetLang: string;
  pinyin?: string;
  sourceType: TranslationSourceType;
  provider: string;
  metadata?: string;
  createdAt: string;
}

import { LoggingConfig } from './logging';
export * from './logging';

export interface AppSettings {
  general: {
    nativeLanguage: SupportedLanguage;
    primaryTarget: SupportedLanguage;
    secondaryTarget: SupportedLanguage;
    theme: 'dark' | 'light' | 'system';
    startAtLogin: boolean;
    minimizeToTray: boolean;
    enableClipboardWatcher: boolean;
  };
  pinyin: {
    displayMode: 'always' | 'hover' | 'learning_only';
    toneStyle: 'marks' | 'numbers' | 'colorized';
  };
  hotkeys: {
    screenTranslate: string;
    ocrCapture: string;
    clipboardTranslate: string;
    liveVoice: string;
    subtitleMode: string;
  };
  providers: {
    translationProvider: 'google_free' | 'gemini' | 'openai' | 'deepl';
    ocrProvider: 'tesseract' | 'gemini';
    aiProvider: 'gemini' | 'openai';
    ttsProvider: 'system' | 'google' | 'openai';
    sttProvider: 'system' | 'whisper' | 'gemini';
    geminiApiKey: string;
    geminiModel: string;
    openaiApiKey: string;
    openaiModel: string;
    deeplApiKey: string;
  };
  subtitles: {
    fontSize: number;
    opacity: number;
    alwaysOnTop: boolean;
    clickThrough: boolean;
    showPinyin: boolean;
    textColor: string;
    backgroundColor: string;
    maxLines: number;
    subtitleTheme?: 'follow_app' | 'dark' | 'light' | 'transparent';
  };
  logging: LoggingConfig;
}

export interface LearningStatistics {
  id?: number;
  date: string;
  wordsLearned: number;
  wordsReviewed: number;
  listeningMinutes: number;
  speakingMinutes: number;
  studyMinutesChinese: number;
  studyMinutesEnglish: number;
  streakDays: number;
}
