import { useMemo } from 'react';
import { useSettingsStore } from './stores/useSettingsStore';
import {
  FeatureFlagId,
  FEATURE_FLAGS,
  getAllFeatureFlags,
  hasGeminiKey,
  hasOpenAiKey,
  hasDeepLKey,
  hasAnyAiKey,
  isFeatureEnabled,
} from './featureFlags';

export function useFeatureFlags() {
  const { settings } = useSettingsStore();

  const flags = useMemo(() => getAllFeatureFlags(settings), [
    settings?.providers?.geminiApiKey,
    settings?.providers?.openaiApiKey,
    settings?.providers?.deeplApiKey,
  ]);

  const geminiAvailable = useMemo(() => hasGeminiKey(settings), [settings?.providers?.geminiApiKey]);
  const openAiAvailable = useMemo(() => hasOpenAiKey(settings), [settings?.providers?.openaiApiKey]);
  const deepLAvailable = useMemo(() => hasDeepLKey(settings), [settings?.providers?.deeplApiKey]);
  const anyAiAvailable = useMemo(
    () => hasAnyAiKey(settings),
    [settings?.providers?.geminiApiKey, settings?.providers?.openaiApiKey]
  );

  const isEnabled = (flag: FeatureFlagId): boolean => {
    return flags[flag] ?? false;
  };

  return {
    flags,
    isEnabled,
    // 8 Feature flag getters
    isAiTutorEnabled: flags.aiTutor,
    isVoiceEnabled: flags.voice,
    isSubtitlesMicEnabled: flags.subtitlesMic,
    isPracticeSpeakingEnabled: flags.practiceSpeaking,
    isOcrGeminiVisionEnabled: flags.ocrGeminiVision,
    isTranslationDeepLEnabled: flags.translationDeepL,
    isTtsOpenAiEnabled: flags.ttsOpenAI,
    isSttWhisperEnabled: flags.sttWhisper,
    // Provider statuses
    hasGeminiKey: geminiAvailable,
    hasOpenAiKey: openAiAvailable,
    hasDeepLKey: deepLAvailable,
    hasAnyAiKey: anyAiAvailable,
    // Metadata helper
    getFeatureMeta: (flag: FeatureFlagId) => FEATURE_FLAGS[flag],
    settings,
  };
}

