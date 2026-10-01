import { AppSettings } from '../shared/types';

export type FeatureFlagId =
  | 'aiTutor'
  | 'voice'
  | 'subtitlesMic'
  | 'practiceSpeaking'
  | 'ocrGeminiVision'
  | 'translationDeepL'
  | 'ttsOpenAI'
  | 'sttWhisper';

export type FeatureFlag = FeatureFlagId;

export interface FeatureFlagMeta {
  id: FeatureFlagId;
  name: string;
  description: string;
  requiredKeys: Array<'geminiApiKey' | 'openaiApiKey' | 'deeplApiKey'>;
  requiredKeyDescription: string;
  check: (providers?: AppSettings['providers']) => boolean;
}

export function hasGeminiKey(settings?: AppSettings | null): boolean {
  return Boolean(settings?.providers?.geminiApiKey?.trim());
}

export function hasOpenAiKey(settings?: AppSettings | null): boolean {
  return Boolean(settings?.providers?.openaiApiKey?.trim());
}

export function hasDeepLKey(settings?: AppSettings | null): boolean {
  return Boolean(settings?.providers?.deeplApiKey?.trim());
}

export function hasAnyAiKey(settings?: AppSettings | null): boolean {
  return hasGeminiKey(settings) || hasOpenAiKey(settings);
}

export const FEATURE_FLAGS: Record<FeatureFlagId, FeatureFlagMeta> = {
  aiTutor: {
    id: 'aiTutor',
    name: 'Gia sư AI (AI Tutor)',
    description: 'Trò chuyện tương tác và chữa bài luyện tập với AI. Yêu cầu Gemini API Key hoặc OpenAI API Key.',
    requiredKeys: ['geminiApiKey', 'openaiApiKey'],
    requiredKeyDescription: 'Gemini hoặc OpenAI API Key',
    check: (providers) => Boolean(providers?.geminiApiKey?.trim() || providers?.openaiApiKey?.trim()),
  },
  voice: {
    id: 'voice',
    name: 'Dịch giọng nói trực tiếp (Voice / STT)',
    description: 'Nhận diện và dịch giọng nói trực tiếp thời gian thực qua Micro. Yêu cầu Gemini API Key hoặc OpenAI API Key.',
    requiredKeys: ['geminiApiKey', 'openaiApiKey'],
    requiredKeyDescription: 'Gemini hoặc OpenAI API Key',
    check: (providers) => Boolean(providers?.geminiApiKey?.trim() || providers?.openaiApiKey?.trim()),
  },
  subtitlesMic: {
    id: 'subtitlesMic',
    name: 'Micro phụ đề trực tiếp (Subtitles Live Mic)',
    description: 'Nhận diện giọng nói thời gian thực và tự động phát phụ đề nổi lên màn hình. Yêu cầu Gemini API Key hoặc OpenAI API Key.',
    requiredKeys: ['geminiApiKey', 'openaiApiKey'],
    requiredKeyDescription: 'Gemini hoặc OpenAI API Key',
    check: (providers) => Boolean(providers?.geminiApiKey?.trim() || providers?.openaiApiKey?.trim()),
  },
  practiceSpeaking: {
    id: 'practiceSpeaking',
    name: 'Luyện nói phát âm AI (Practice Speaking)',
    description: 'Thu âm phát âm, chấm điểm độ chính xác và nhận phản hồi chi tiết từ AI. Yêu cầu Gemini API Key hoặc OpenAI API Key.',
    requiredKeys: ['geminiApiKey', 'openaiApiKey'],
    requiredKeyDescription: 'Gemini hoặc OpenAI API Key',
    check: (providers) => Boolean(providers?.geminiApiKey?.trim() || providers?.openaiApiKey?.trim()),
  },
  ocrGeminiVision: {
    id: 'ocrGeminiVision',
    name: 'Google Gemini Vision OCR',
    description: 'Nhận diện chữ Hán và đa ngôn ngữ qua mô hình thị giác đa phương thức Gemini. Yêu cầu Gemini API Key.',
    requiredKeys: ['geminiApiKey'],
    requiredKeyDescription: 'Gemini API Key',
    check: (providers) => Boolean(providers?.geminiApiKey?.trim()),
  },
  translationDeepL: {
    id: 'translationDeepL',
    name: 'Dịch thuật DeepL (DeepL Translation)',
    description: 'Dịch thuật chuẩn tự nhiên cao cấp với DeepL API. Yêu cầu DeepL API Key.',
    requiredKeys: ['deeplApiKey'],
    requiredKeyDescription: 'DeepL API Key',
    check: (providers) => Boolean(providers?.deeplApiKey?.trim()),
  },
  ttsOpenAI: {
    id: 'ttsOpenAI',
    name: 'OpenAI TTS',
    description: 'Phát âm giọng đọc tự nhiên chuẩn xác từ OpenAI. Yêu cầu OpenAI API Key.',
    requiredKeys: ['openaiApiKey'],
    requiredKeyDescription: 'OpenAI API Key',
    check: (providers) => Boolean(providers?.openaiApiKey?.trim()),
  },
  sttWhisper: {
    id: 'sttWhisper',
    name: 'Whisper STT (OpenAI)',
    description: 'Nhận diện giọng nói chuẩn xác với mô hình OpenAI Whisper. Yêu cầu OpenAI API Key.',
    requiredKeys: ['openaiApiKey'],
    requiredKeyDescription: 'OpenAI API Key',
    check: (providers) => Boolean(providers?.openaiApiKey?.trim()),
  },
};

export function isFeatureEnabled(flag: FeatureFlagId, settings?: AppSettings | null): boolean {
  const meta = FEATURE_FLAGS[flag];
  if (!meta) return false;
  return meta.check(settings?.providers);
}

export function getAllFeatureFlags(settings?: AppSettings | null): Record<FeatureFlagId, boolean> {
  const providers = settings?.providers;
  return {
    aiTutor: FEATURE_FLAGS.aiTutor.check(providers),
    voice: FEATURE_FLAGS.voice.check(providers),
    subtitlesMic: FEATURE_FLAGS.subtitlesMic.check(providers),
    practiceSpeaking: FEATURE_FLAGS.practiceSpeaking.check(providers),
    ocrGeminiVision: FEATURE_FLAGS.ocrGeminiVision.check(providers),
    translationDeepL: FEATURE_FLAGS.translationDeepL.check(providers),
    ttsOpenAI: FEATURE_FLAGS.ttsOpenAI.check(providers),
    sttWhisper: FEATURE_FLAGS.sttWhisper.check(providers),
  };
}

