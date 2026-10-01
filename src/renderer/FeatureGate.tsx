import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Key,
  Sparkles,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Settings as SettingsIcon,
} from 'lucide-react';
import { FeatureFlagId, FEATURE_FLAGS } from './featureFlags';
import { useFeatureFlags } from './useFeatureFlags';
import { useSettingsStore } from './stores/useSettingsStore';
import { useAppStore } from './stores/useAppStore';

export interface FeatureGateProps {
  feature: FeatureFlagId;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  mode?: 'page' | 'card' | 'inline' | 'hide';
  title?: string;
  description?: string;
  showQuickKeyInput?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  mode = 'card',
  title,
  description,
  showQuickKeyInput = true,
}) => {
  const navigate = useNavigate();
  const { isEnabled } = useFeatureFlags();
  const { settings, updateSettings } = useSettingsStore();
  const { showToast } = useAppStore();

  const [quickKey, setQuickKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const enabled = isEnabled(feature);

  if (enabled) {
    return <>{children}</>;
  }

  // If a custom fallback is explicitly provided (even null)
  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  if (mode === 'hide') {
    return null;
  }

  const meta = FEATURE_FLAGS[feature] || {
    id: feature,
    name: 'Tính năng giới hạn',
    description: 'Tính năng này yêu cầu cấu hình API Key.',
    requiredKeys: ['geminiApiKey'],
    requiredKeyDescription: 'API Key',
  };

  const displayTitle = title || meta.name;
  const displayDescription = description || meta.description;

  // Primary key type to offer for quick setup
  const allowsGemini = meta.requiredKeys.includes('geminiApiKey');
  const allowsOpenAi = meta.requiredKeys.includes('openaiApiKey');
  const allowsDeepL = meta.requiredKeys.includes('deeplApiKey');

  const defaultKeyTarget = allowsGemini
    ? 'geminiApiKey'
    : allowsOpenAi
    ? 'openaiApiKey'
    : 'deeplApiKey';

  const defaultKeyPlaceholder = allowsGemini
    ? 'Dán Google Gemini API Key (AIzaSy...)'
    : allowsOpenAi
    ? 'Dán OpenAI API Key (sk-proj-...)'
    : 'Dán DeepL API Key...';

  const getFreeKeyUrl = allowsGemini
    ? 'https://aistudio.google.com/app/apikey'
    : allowsOpenAi
    ? 'https://platform.openai.com/api-keys'
    : 'https://www.deepl.com/pro-api';

  const getFreeKeyText = allowsGemini
    ? 'Lấy Gemini API Key miễn phí 100% tại Google AI Studio'
    : allowsOpenAi
    ? 'Lấy API Key tại OpenAI Platform'
    : 'Đăng ký DeepL API Key';

  const handleSaveQuickKey = async () => {
    if (!quickKey.trim()) return;
    setIsSaving(true);
    try {
      await updateSettings({
        providers: {
          ...settings.providers,
          [defaultKeyTarget]: quickKey.trim(),
        },
      });
      showToast(`Đã lưu API Key thành công và mở khóa "${displayTitle}"!`, 'success');
      setQuickKey('');
    } catch (err: any) {
      showToast(`Không thể lưu API Key: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Inline mode (small subtle banner)
  if (mode === 'inline') {
    return (
      <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-primary-muted border border-primary/30 text-xs shadow-google-sm">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary shrink-0" />
          <span className="text-foreground">
            <strong>{displayTitle}</strong> yêu cầu {meta.requiredKeyDescription}.
          </span>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="px-3 py-1 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary-hover transition-colors shrink-0 flex items-center gap-1"
        >
          <SettingsIcon className="w-3 h-3" />
          <span>Cấu hình</span>
        </button>
      </div>
    );
  }

  // Page or Card mode (Full gate view)
  const isPage = mode === 'page';

  return (
    <div
      className={`${
        isPage
          ? 'min-h-[calc(100vh-8rem)] flex items-center justify-center p-6'
          : 'p-6 rounded-3xl bg-card border border-border shadow-google-md'
      }`}
    >
      <div className="max-w-xl w-full mx-auto space-y-5 text-center sm:text-left">
        {/* Header Icon + Titles */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-muted text-primary border border-primary/30 flex items-center justify-center shrink-0 shadow-google-sm">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-warning-muted text-warning border border-warning/30 text-[11px] font-semibold">
              <Key className="w-3 h-3" />
              <span>Cần {meta.requiredKeyDescription}</span>
            </div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">{displayTitle}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">{displayDescription}</p>
          </div>
        </div>

        {/* Quick API Key Input if enabled */}
        {showQuickKeyInput && (
          <div className="p-4 rounded-2xl bg-surface border border-border space-y-3 shadow-google-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Kích hoạt nhanh trong 1 giây:</span>
              </span>
              <a
                href={getFreeKeyUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <span>{getFreeKeyText}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="password"
                value={quickKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuickKey(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') handleSaveQuickKey();
                }}
                placeholder={defaultKeyPlaceholder}
                className="flex-1 bg-surface-hover border border-border text-foreground px-3.5 py-2 rounded-xl text-xs font-mono focus:outline-none focus:border-primary shadow-google-sm"
              />
              <button
                onClick={handleSaveQuickKey}
                disabled={isSaving || !quickKey.trim()}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground font-semibold text-xs shadow-google-sm transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Lưu & Mở khóa</span>
              </button>
            </div>
          </div>
        )}

        {/* Action footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border text-xs">
          <span className="text-muted-foreground text-[11px]">
            Toàn bộ API Key được lưu trữ mã hóa an toàn trên máy cá nhân của bạn.
          </span>
          <button
            onClick={() => navigate('/settings')}
            className="px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-hover text-foreground border border-border font-medium text-xs shadow-google-sm flex items-center gap-1.5 transition-colors"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Mở trang Cài đặt đầy đủ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

