import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Key, 
  Keyboard, 
  Eye, 
  ShieldCheck, 
  Check, 
  Sliders, 
  Sparkles,
  Info,
  Sun,
  Moon,
  Monitor,
  Palette,
  Subtitles,
  ScrollText,
  ExternalLink,
  Terminal,
  Activity,
  AlertTriangle,
  Lock,
  Unlock,
  ScanText,
  Mic,
} from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useAppStore } from '../stores/useAppStore';
import { useFeatureFlags } from '../useFeatureFlags';
import { FEATURE_FLAGS, FeatureFlagId } from '../featureFlags';
import { AppSettings } from '../../shared/types';
import { ThemeMode, SubtitleThemeMode } from '../../shared/design/theme';
import { ThemePreviewCard } from '../components/common/ThemePreviewCard';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { dict, settings, updateSettings, themeMode, setThemeMode, subtitleTheme, setSubtitleTheme, effectiveTheme } = useSettingsStore();
  const { showToast } = useAppStore();

  const [form, setForm] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'providers' | 'hotkeys' | 'privacy' | 'logging'>('appearance');
  const [isSaving, setIsSaving] = useState(false);

  // Evaluate key availability considering both current form edits and saved settings
  const hasGeminiKey = Boolean(form.providers.geminiApiKey?.trim() || settings.providers?.geminiApiKey?.trim());
  const hasOpenAiKey = Boolean(form.providers.openaiApiKey?.trim() || settings.providers?.openaiApiKey?.trim());
  const hasDeepLKey = Boolean(form.providers.deeplApiKey?.trim() || settings.providers?.deeplApiKey?.trim());

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings(form);
      if (window.electronAPI?.updateLogConfig && form.logging) {
        await window.electronAPI.updateLogConfig(form.logging);
      }
      showToast(dict.settings.saveSuccess, 'success');
    } catch (err: any) {
      showToast(`Lỗi lưu cài đặt: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    setForm((prev) => ({
      ...prev,
      general: {
        ...prev.general,
        theme: mode,
      },
    }));
  };

  const handleSelectSubtitleTheme = (mode: SubtitleThemeMode) => {
    setSubtitleTheme(mode);
    setForm((prev) => ({
      ...prev,
      subtitles: {
        ...prev.subtitles,
        subtitleTheme: mode,
      },
    }));
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{dict.settings.title}</h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          Tùy chỉnh hệ thống giao diện chuẩn Google, nhà cung cấp AI, phím tắt toàn hệ thống và cửa sổ phụ đề.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`px-4 py-2 rounded-2xl transition-all flex items-center gap-1.5 ${
              activeTab === 'appearance' 
                ? 'bg-primary text-primary-foreground shadow-google-sm font-semibold' 
                : 'text-foreground-secondary hover:text-foreground hover:bg-surface-hover'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{dict.settings.appearance}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-2xl transition-all ${
              activeTab === 'general' 
                ? 'bg-primary text-primary-foreground shadow-google-sm font-semibold' 
                : 'text-foreground-secondary hover:text-foreground hover:bg-surface-hover'
            }`}
          >
            {dict.settings.general}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('providers')}
            className={`px-4 py-2 rounded-2xl transition-all ${
              activeTab === 'providers' 
                ? 'bg-primary text-primary-foreground shadow-google-sm font-semibold' 
                : 'text-foreground-secondary hover:text-foreground hover:bg-surface-hover'
            }`}
          >
            {dict.settings.providers}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hotkeys')}
            className={`px-4 py-2 rounded-2xl transition-all ${
              activeTab === 'hotkeys' 
                ? 'bg-primary text-primary-foreground shadow-google-sm font-semibold' 
                : 'text-foreground-secondary hover:text-foreground hover:bg-surface-hover'
            }`}
          >
            {dict.settings.hotkeys}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2 rounded-2xl transition-all ${
              activeTab === 'privacy' 
                ? 'bg-primary text-primary-foreground shadow-google-sm font-semibold' 
                : 'text-foreground-secondary hover:text-foreground hover:bg-surface-hover'
            }`}
          >
            {dict.settings.privacy}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logging')}
            className={`px-4 py-2 rounded-2xl transition-all flex items-center gap-1.5 ${
              activeTab === 'logging' 
                ? 'bg-primary text-primary-foreground shadow-google-sm font-semibold' 
                : 'text-foreground-secondary hover:text-foreground hover:bg-surface-hover'
            }`}
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span>Nhật ký & Giám sát</span>
          </button>
        </div>

        {/* Tab: Appearance & Theme System */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            {/* 1. Theme Mode Selector Cards */}
            <div className="p-6 bg-card border border-border rounded-3xl space-y-4 shadow-google-md text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Chế độ giao diện (App Theme Mode)</h3>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    Hệ màu thiết kế lấy cảm hứng từ Google, bảo vệ mắt và chuyển đổi tức thì không cần tải lại trang.
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-hover text-foreground border border-border">
                  Đang dùng: {effectiveTheme === 'dark' ? 'Tối (Dark)' : 'Sáng (Light)'}
                </span>
              </div>

              {/* 3 Visual Interactive Radio Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {/* Dark Theme Card */}
                <div
                  onClick={() => handleSelectThemeMode('dark')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-3 relative ${
                    themeMode === 'dark'
                      ? 'border-primary bg-primary-muted/20 shadow-google-md'
                      : 'border-border bg-surface hover:border-primary/40 hover:bg-surface-hover'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-[#292a2d] border border-[#3c4043] flex items-center justify-center text-[#8ab4f8]">
                        <Moon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-foreground text-xs">Giao diện Tối (Dark)</span>
                    </div>
                    {themeMode === 'dark' && (
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {/* Mini Palette Illustration */}
                  <div className="p-2.5 rounded-xl bg-[#202124] border border-[#3c4043] space-y-1.5 pointer-events-none">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#8ab4f8]" />
                      <div className="w-12 h-1.5 rounded-full bg-[#3c4043]" />
                    </div>
                    <div className="h-6 rounded-lg bg-[#292a2d] border border-[#3c4043] p-1 flex items-center justify-between">
                      <div className="w-10 h-1.5 rounded-full bg-[#e8eaed]/80" />
                      <div className="w-3 h-3 rounded-md bg-[#81c995]" />
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Màu nền than chì trầm <code>#202124</code>, bề mặt <code>#292A2D</code> êm mắt, không chói gắt.
                  </p>
                </div>

                {/* Light Theme Card */}
                <div
                  onClick={() => handleSelectThemeMode('light')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-3 relative ${
                    themeMode === 'light'
                      ? 'border-primary bg-primary-muted/20 shadow-google-md'
                      : 'border-border bg-surface hover:border-primary/40 hover:bg-surface-hover'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-[#f1f3f4] border border-[#dadce0] flex items-center justify-center text-[#1a73e8]">
                        <Sun className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-foreground text-xs">Giao diện Sáng (Light)</span>
                    </div>
                    {themeMode === 'light' && (
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {/* Mini Palette Illustration */}
                  <div className="p-2.5 rounded-xl bg-[#f8f9fa] border border-[#dadce0] space-y-1.5 pointer-events-none">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#1a73e8]" />
                      <div className="w-12 h-1.5 rounded-full bg-[#dadce0]" />
                    </div>
                    <div className="h-6 rounded-lg bg-[#ffffff] border border-[#dadce0] p-1 flex items-center justify-between shadow-sm">
                      <div className="w-10 h-1.5 rounded-full bg-[#202124]/80" />
                      <div className="w-3 h-3 rounded-md bg-[#1e8e3e]" />
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Nền trung tính ấm <code>#F8F9FA</code> dịu nhẹ, bề mặt <code>#FFFFFF</code> và viền thanh mảnh.
                  </p>
                </div>

                {/* System Theme Card */}
                <div
                  onClick={() => handleSelectThemeMode('system')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-3 relative ${
                    themeMode === 'system'
                      ? 'border-primary bg-primary-muted/20 shadow-google-md'
                      : 'border-border bg-surface hover:border-primary/40 hover:bg-surface-hover'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-surface-hover border border-border flex items-center justify-center text-primary">
                        <Monitor className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-foreground text-xs">Theo Hệ Thống (System)</span>
                    </div>
                    {themeMode === 'system' && (
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {/* Mini Split Palette Illustration */}
                  <div className="p-2.5 rounded-xl border border-border flex overflow-hidden pointer-events-none">
                    <div className="w-1/2 bg-[#202124] p-1 space-y-1 border-r border-[#3c4043]">
                      <div className="w-2 h-2 rounded-full bg-[#8ab4f8]" />
                      <div className="w-8 h-1 rounded-full bg-[#3c4043]" />
                    </div>
                    <div className="w-1/2 bg-[#f8f9fa] p-1 space-y-1">
                      <div className="w-2 h-2 rounded-full bg-[#1a73e8]" />
                      <div className="w-8 h-1 rounded-full bg-[#dadce0]" />
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Tự động đồng bộ theo chế độ sáng/tối của Windows qua <code>prefers-color-scheme</code>.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Subtitle Overlay Theme Options */}
            <div className="p-6 bg-card border border-border rounded-3xl space-y-4 shadow-google-md text-xs">
              <div className="flex items-center gap-2">
                <Subtitles className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Giao diện cửa sổ Phụ đề nổi (Subtitle Overlay Theme)</h3>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Chọn kiểu nền phụ đề khi xem phim, video YouTube, anime hoặc hiển thị song song khi chơi game.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                {[
                  { id: 'follow_app', label: 'Theo ứng dụng', desc: 'Đồng bộ theo theme app hiện tại' },
                  { id: 'dark', label: 'Chế độ Tối', desc: 'Nền than chì #202124 chữ sáng' },
                  { id: 'light', label: 'Chế độ Sáng', desc: 'Nền mềm sáng #FFFFFF chữ tối' },
                  { id: 'transparent', label: 'Nền trong suốt', desc: 'Không viền hộp, bóng chữ xem video' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSubtitleTheme(item.id as SubtitleThemeMode)}
                    className={`p-3 rounded-2xl border text-left transition-all space-y-1 shadow-google-sm ${
                      subtitleTheme === item.id
                        ? 'border-primary bg-primary-muted/20 font-semibold'
                        : 'border-border bg-surface hover:bg-surface-hover text-foreground-secondary hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-xs">{item.label}</span>
                      {subtitleTheme === item.id && <Check className="w-3.5 h-3.5 text-primary" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </button>
                ))}
              </div>

              {/* Subtitle Font Size & Opacity sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-border">
                <div>
                  <div className="flex justify-between text-foreground mb-1">
                    <span>Cỡ chữ phụ đề:</span>
                    <span className="font-bold text-primary">{form.subtitles.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="14"
                    max="36"
                    value={form.subtitles.fontSize}
                    onChange={(e) =>
                      setForm({ ...form, subtitles: { ...form.subtitles, fontSize: Number(e.target.value) } })
                    }
                    className="w-full h-1 accent-primary cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-foreground mb-1">
                    <span>Độ trong suốt nền phụ đề:</span>
                    <span className="font-bold text-primary">{Math.round(form.subtitles.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={form.subtitles.opacity}
                    onChange={(e) =>
                      setForm({ ...form, subtitles: { ...form.subtitles, opacity: Number(e.target.value) } })
                    }
                    className="w-full h-1 accent-primary cursor-pointer"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={form.subtitles.showPinyin}
                  onChange={(e) =>
                    setForm({ ...form, subtitles: { ...form.subtitles, showPinyin: e.target.checked } })
                  }
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
                <span className="text-foreground">Hiển thị phiên âm Pinyin phía trên bản dịch phụ đề</span>
              </label>
            </div>

            {/* 3. Live Interactive Theme Preview Card */}
            <ThemePreviewCard />
          </div>
        )}

        {/* Tab: General */}
        {activeTab === 'general' && (
          <div className="p-6 bg-card border border-border rounded-3xl space-y-4 shadow-google-md text-xs">
            <h3 className="text-sm font-bold text-foreground mb-2">Ngôn ngữ mặc định của người học</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-muted-foreground mb-1">Ngôn ngữ mẹ đẻ:</label>
                <select
                  value={form.general.nativeLanguage}
                  onChange={(e) =>
                    setForm({ ...form, general: { ...form.general, nativeLanguage: e.target.value as any } })
                  }
                  className="w-full bg-surface border border-border rounded-2xl p-2.5 text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="vi">Tiếng Việt (Mặc định)</option>
                  <option value="en">English</option>
                  <option value="zh">简体中文</option>
                </select>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Mục tiêu học tập chính:</label>
                <select
                  value={form.general.primaryTarget}
                  onChange={(e) =>
                    setForm({ ...form, general: { ...form.general, primaryTarget: e.target.value as any } })
                  }
                  className="w-full bg-surface border border-border rounded-2xl p-2.5 text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="zh">Tiếng Trung Giản Thể (HSK)</option>
                  <option value="en">Tiếng Anh (CEFR)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Hành động khi bấm nút đóng (X):
                </label>
                <select
                  value={form.general.closeAction || (form.general.minimizeToTray ? 'minimize_to_tray' : 'ask')}
                  onChange={(e) => {
                    const action = e.target.value as 'ask' | 'minimize_to_tray' | 'exit';
                    setForm({
                      ...form,
                      general: {
                        ...form.general,
                        closeAction: action,
                        minimizeToTray: action !== 'exit',
                      },
                    });
                  }}
                  className="w-full bg-surface border border-border rounded-xl p-2.5 text-foreground text-sm focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="ask">Hỏi tôi mỗi lần (Hiển thị hộp thoại lựa chọn)</option>
                  <option value="minimize_to_tray">Thu nhỏ xuống khay hệ thống (System Tray)</option>
                  <option value="exit">Thoát hoàn toàn ứng dụng</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Chọn hiển thị hộp thoại xác nhận hoặc tự động thu nhỏ / thoát khi đóng cửa sổ.
                </p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.general.enableClipboardWatcher}
                  onChange={(e) =>
                    setForm({ ...form, general: { ...form.general, enableClipboardWatcher: e.target.checked } })
                  }
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
                <span className="text-foreground">
                  Tự động nhận diện và gợi ý dịch khi sao chép văn bản tiếng Trung / tiếng Anh (Clipboard Watcher)
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Tab: Providers */}
        {activeTab === 'providers' && (
          <div className="p-6 bg-card border border-border rounded-3xl space-y-5 shadow-google-md text-xs">
            <div className="p-3.5 bg-primary-muted border border-primary/30 rounded-2xl flex items-center gap-2.5 text-primary">
              <Info className="w-5 h-5 text-primary shrink-0" />
              <span>
                Hệ thống tích hợp sẵn <strong>Google Dịch Miễn Phí</strong> & <strong>Tesseract OCR</strong> chạy ngay mà không bắt buộc có API Key. Thêm API Key dưới đây để mở khóa phân tích ngữ pháp AI thông minh hơn.
              </span>
            </div>

            {/* 1. Translation Provider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-muted-foreground font-medium">Nhà cung cấp dịch thuật chính:</label>
                {!hasDeepLKey && (
                  <span className="text-[10px] text-muted-foreground">
                    DeepL đã bị ẩn (cần nhập DeepL API Key bên dưới để mở khóa)
                  </span>
                )}
              </div>
              <select
                value={form.providers.translationProvider}
                onChange={(e) =>
                  setForm({ ...form, providers: { ...form.providers, translationProvider: e.target.value as any } })
                }
                className="w-full bg-surface border border-border rounded-2xl p-2.5 text-foreground focus:outline-none focus:border-primary"
              >
                <option value="google_free">Google Dịch (Miễn phí, không cần Key)</option>
                <option value="gemini">Google Gemini AI</option>
                <option value="openai">OpenAI (GPT-4o Mini)</option>
                {hasDeepLKey && <option value="deepl">DeepL Translation (Đã mở khóa)</option>}
              </select>
            </div>

            {/* 2. OCR Provider (Filter Gemini Vision if no key) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-muted-foreground font-medium">Nhà cung cấp nhận diện ký tự (OCR):</label>
                {!hasGeminiKey && (
                  <span className="text-[10px] text-muted-foreground">
                    Gemini Vision đã bị ẩn (cần Gemini API Key để mở khóa)
                  </span>
                )}
              </div>
              <select
                value={form.providers.ocrProvider || 'tesseract'}
                onChange={(e) =>
                  setForm({ ...form, providers: { ...form.providers, ocrProvider: e.target.value as any } })
                }
                className="w-full bg-surface border border-border rounded-2xl p-2.5 text-foreground focus:outline-none focus:border-primary"
              >
                <option value="tesseract">Tesseract OCR (Miễn phí, ngoại tuyến)</option>
                {hasGeminiKey && <option value="gemini">Google Gemini Vision OCR (Đa phương thức - Đã mở khóa)</option>}
              </select>
            </div>

            {/* 3. TTS Provider (Filter OpenAI TTS if no key) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-muted-foreground font-medium">Nhà cung cấp phát âm giọng đọc (Text To Speech - TTS):</label>
                {!hasOpenAiKey && (
                  <span className="text-[10px] text-muted-foreground">
                    OpenAI TTS đã bị ẩn (cần OpenAI API Key để mở khóa)
                  </span>
                )}
              </div>
              <select
                value={form.providers.ttsProvider || 'google'}
                onChange={(e) =>
                  setForm({ ...form, providers: { ...form.providers, ttsProvider: e.target.value as any } })
                }
                className="w-full bg-surface border border-border rounded-2xl p-2.5 text-foreground focus:outline-none focus:border-primary"
              >
                <option value="google">Google Natural TTS (Khuyên dùng - Chuẩn âm điệu Tiếng Trung, Tiếng Anh, Tiếng Việt)</option>
                <option value="system">Hệ thống Windows (SpeechSynthesis SAPI)</option>
                {hasOpenAiKey && <option value="openai">OpenAI TTS (Đã mở khóa)</option>}
              </select>
            </div>

            {/* 4. STT Provider (Filter Whisper STT if no key) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-muted-foreground font-medium">Nhà cung cấp nhận diện giọng nói (Speech-to-Text - STT):</label>
                {!hasOpenAiKey && (
                  <span className="text-[10px] text-muted-foreground">
                    Whisper STT đã bị ẩn (cần OpenAI API Key để mở khóa)
                  </span>
                )}
              </div>
              <select
                value={form.providers.sttProvider || 'system'}
                onChange={(e) =>
                  setForm({ ...form, providers: { ...form.providers, sttProvider: e.target.value as any } })
                }
                className="w-full bg-surface border border-border rounded-2xl p-2.5 text-foreground focus:outline-none focus:border-primary"
              >
                <option value="system">Hệ thống (Web Speech API / Micro Windows)</option>
                <option value="gemini">Google Gemini STT</option>
                {hasOpenAiKey && <option value="whisper">OpenAI Whisper STT (Đã mở khóa)</option>}
              </select>
            </div>

            {/* Gemini Settings */}
            <div className="p-4 bg-surface rounded-2xl border border-border space-y-3 shadow-google-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-warning" />
                  <span>Google Gemini API (Gia sư AI, Phân tích câu, Gemini Vision)</span>
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${hasGeminiKey ? 'bg-success-muted text-success border border-success/30' : 'bg-muted-foreground/10 text-muted-foreground'}`}>
                  {hasGeminiKey ? 'Đã kích hoạt' : 'Chưa cấu hình'}
                </span>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Gemini API Key:</label>
                <input
                  type="password"
                  value={form.providers.geminiApiKey}
                  onChange={(e) =>
                    setForm({ ...form, providers: { ...form.providers, geminiApiKey: e.target.value } })
                  }
                  placeholder="AIzaSy..."
                  className="w-full bg-surface-hover border border-border rounded-xl p-2.5 text-foreground font-mono focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Model:</label>
                <input
                  type="text"
                  value={form.providers.geminiModel}
                  onChange={(e) =>
                    setForm({ ...form, providers: { ...form.providers, geminiModel: e.target.value } })
                  }
                  className="w-full bg-surface-hover border border-border rounded-xl p-2.5 text-foreground font-mono focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* OpenAI Settings */}
            <div className="p-4 bg-surface rounded-2xl border border-border space-y-3 shadow-google-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-primary" />
                  <span>OpenAI API (GPT-4o Mini, OpenAI TTS, Whisper STT)</span>
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${hasOpenAiKey ? 'bg-success-muted text-success border border-success/30' : 'bg-muted-foreground/10 text-muted-foreground'}`}>
                  {hasOpenAiKey ? 'Đã kích hoạt' : 'Chưa cấu hình'}
                </span>
              </div>
              <div>
                <label className="block text-muted-foreground mb-1">OpenAI API Key:</label>
                <input
                  type="password"
                  value={form.providers.openaiApiKey}
                  onChange={(e) =>
                    setForm({ ...form, providers: { ...form.providers, openaiApiKey: e.target.value } })
                  }
                  placeholder="sk-proj-..."
                  className="w-full bg-surface-hover border border-border rounded-xl p-2.5 text-foreground font-mono focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* DeepL Settings */}
            <div className="p-4 bg-surface rounded-2xl border border-border space-y-3 shadow-google-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-primary" />
                  <span>DeepL API (Dịch thuật chất lượng cao DeepL)</span>
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${hasDeepLKey ? 'bg-success-muted text-success border border-success/30' : 'bg-muted-foreground/10 text-muted-foreground'}`}>
                  {hasDeepLKey ? 'Đã kích hoạt' : 'Chưa cấu hình'}
                </span>
              </div>
              <div>
                <label className="block text-muted-foreground mb-1">DeepL API Key:</label>
                <input
                  type="password"
                  value={form.providers.deeplApiKey || ''}
                  onChange={(e) =>
                    setForm({ ...form, providers: { ...form.providers, deeplApiKey: e.target.value } })
                  }
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx"
                  className="w-full bg-surface-hover border border-border rounded-xl p-2.5 text-foreground font-mono focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Feature Flags Overview Matrix */}
            <div className="p-4 bg-surface rounded-2xl border border-border space-y-3 shadow-google-sm">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Trạng thái mở khóa 8 tính năng hệ thống (Feature Flags)</span>
                </span>
                <span className="text-[11px] text-muted-foreground">Tự động kích hoạt khi có API Key tương ứng</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {[
                  { id: 'aiTutor', name: 'Gia sư AI', active: hasGeminiKey || hasOpenAiKey, req: 'Gemini / OpenAI' },
                  { id: 'voice', name: 'Dịch giọng nói (STT)', active: hasGeminiKey || hasOpenAiKey, req: 'Gemini / OpenAI' },
                  { id: 'subtitlesMic', name: 'Micro phụ đề', active: hasGeminiKey || hasOpenAiKey, req: 'Gemini / OpenAI' },
                  { id: 'practiceSpeaking', name: 'Luyện nói phát âm', active: hasGeminiKey || hasOpenAiKey, req: 'Gemini / OpenAI' },
                  { id: 'ocrGeminiVision', name: 'Gemini Vision OCR', active: hasGeminiKey, req: 'Gemini' },
                  { id: 'translationDeepL', name: 'DeepL Dịch thuật', active: hasDeepLKey, req: 'DeepL' },
                  { id: 'ttsOpenAI', name: 'OpenAI TTS', active: hasOpenAiKey, req: 'OpenAI' },
                  { id: 'sttWhisper', name: 'Whisper STT', active: hasOpenAiKey, req: 'OpenAI' },
                ].map((item) => (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      item.active
                        ? 'bg-success-muted/20 border-success/30 text-foreground'
                        : 'bg-surface-hover border-border text-muted-foreground'
                    }`}
                  >
                    <div className="space-y-0.5 truncate">
                      <div className="font-semibold text-[11px] truncate">{item.name}</div>
                      <div className="text-[10px] text-muted-foreground">Cần: {item.req}</div>
                    </div>
                    {item.active ? (
                      <Check className="w-3.5 h-3.5 text-success shrink-0 ml-1.5" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-warning shrink-0 ml-1.5" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Hotkeys */}
        {activeTab === 'hotkeys' && (
          <div className="p-6 bg-card border border-border rounded-3xl space-y-4 shadow-google-md text-xs">
            <h3 className="text-sm font-bold text-foreground mb-2">Phím tắt toàn cầu (Global Hotkeys)</h3>
            <p className="text-muted-foreground">
              Các phím tắt này hoạt động trên toàn bộ hệ thống Windows kể cả khi đang chơi game full-screen hoặc duyệt web.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border shadow-google-sm">
                <span className="font-semibold text-foreground">Dịch màn hình (Screen Translate):</span>
                <input
                  type="text"
                  value={form.hotkeys.screenTranslate}
                  onChange={(e) =>
                    setForm({ ...form, hotkeys: { ...form.hotkeys, screenTranslate: e.target.value } })
                  }
                  className="w-60 bg-surface-hover border border-border rounded-xl p-2 text-center font-mono text-foreground text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border shadow-google-sm">
                <span className="font-semibold text-foreground">Quét chữ OCR (OCR Capture):</span>
                <input
                  type="text"
                  value={form.hotkeys.ocrCapture}
                  onChange={(e) =>
                    setForm({ ...form, hotkeys: { ...form.hotkeys, ocrCapture: e.target.value } })
                  }
                  className="w-60 bg-surface-hover border border-border rounded-xl p-2 text-center font-mono text-foreground text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border shadow-google-sm">
                <span className="font-semibold text-foreground">Bật / Tắt phụ đề nổi (Subtitle Mode):</span>
                <input
                  type="text"
                  value={form.hotkeys.subtitleMode}
                  onChange={(e) =>
                    setForm({ ...form, hotkeys: { ...form.hotkeys, subtitleMode: e.target.value } })
                  }
                  className="w-60 bg-surface-hover border border-border rounded-xl p-2 text-center font-mono text-foreground text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border shadow-google-sm">
                <span className="font-semibold text-foreground">Dịch giọng nói trực tiếp (Live Voice):</span>
                <input
                  type="text"
                  value={form.hotkeys.liveVoice}
                  onChange={(e) =>
                    setForm({ ...form, hotkeys: { ...form.hotkeys, liveVoice: e.target.value } })
                  }
                  className="w-60 bg-surface-hover border border-border rounded-xl p-2 text-center font-mono text-foreground text-xs focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Privacy */}
        {activeTab === 'privacy' && (
          <div className="p-6 bg-card border border-border rounded-3xl space-y-4 shadow-google-md text-xs">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-success" />
              <span>Quyền riêng tư & Bảo mật dữ liệu</span>
            </h3>

            <div className="space-y-3 leading-relaxed text-foreground-secondary">
              <p>
                PolyglotDesktop được thiết kế theo kiến trúc <strong>Local-First</strong> (Ưu tiên dữ liệu cục bộ).
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-muted-foreground pl-2">
                <li>Toàn bộ sổ từ vựng, flashcards, lịch sử ôn tập và thống kê được lưu trữ hoàn toàn ngoại tuyến trong cơ sở dữ liệu SQLite tại thư mục ứng dụng của bạn.</li>
                <li>Ảnh chụp màn hình khi dùng tính năng quét OCR chỉ được xử lý tạm thời và không bị gửi âm thầm lên bất kỳ máy chủ nào.</li>
                <li>Micro chỉ được kích hoạt khi bạn bấm nút ghi âm và có đèn báo hiệu rõ ràng trên giao diện.</li>
                <li>API Keys được lưu trữ an toàn trong tệp cấu hình máy tính cá nhân của bạn.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab: Logging & Monitoring */}
        {activeTab === 'logging' && (
          <div className="space-y-6">
            {/* Quick Banner & Open Log Viewer button */}
            <div className="p-5 bg-card border border-border rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-google-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary-muted text-primary flex items-center justify-center border border-primary/20">
                  <ScrollText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Trình xem & Phân tích nhật ký hệ thống</h3>
                  <p className="text-[11px] text-foreground-secondary">
                    Kiểm tra chi tiết lỗi, hiệu năng, phân tích provider AI và giám sát thời gian thực.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/logs')}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary text-primary-foreground font-semibold text-xs shadow-google-sm hover:opacity-90 transition-all shrink-0"
              >
                <span>Mở Trình xem Logs</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Developer Mode Banner */}
            {form.logging?.developerMode && (
              <div className="p-4 bg-warning-muted/40 border border-warning/40 rounded-2xl flex items-center gap-3 text-xs text-warning">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div>
                  <span className="font-bold">Chế độ nhà phát triển (Developer Mode) đang được BẬT.</span>
                  <p className="text-[11px] text-warning/90 mt-0.5">
                    Hệ thống sẽ ghi nhận chi tiết mức độ DEBUG, chuẩn đoán provider AI, luồng IPC và dữ liệu hiệu năng chuyên sâu.
                  </p>
                </div>
              </div>
            )}

            {/* General Logging Settings */}
            <div className="p-6 bg-card border border-border rounded-3xl space-y-5 shadow-google-md text-xs">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                <span>Cấu hình ghi nhận nhật ký (Core Logging)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Enable Persistent Logging */}
                <div className="flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border">
                  <div>
                    <span className="font-semibold text-foreground block">Lưu trữ log vào SQLite:</span>
                    <span className="text-[11px] text-foreground-secondary">Lưu lịch sử hoạt động để chẩn đoán</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.logging?.enabled ?? true}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        logging: { ...(form.logging || ({} as any)), enabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                </div>

                {/* Min Log Level */}
                <div className="flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border">
                  <div>
                    <span className="font-semibold text-foreground block">Mức độ log tối thiểu:</span>
                    <span className="text-[11px] text-foreground-secondary">Lọc bớt các sự kiện không cần thiết</span>
                  </div>
                  <select
                    value={form.logging?.minLevel || 'info'}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        logging: { ...(form.logging || ({} as any)), minLevel: e.target.value as any },
                      })
                    }
                    className="bg-surface-hover border border-border rounded-xl p-1.5 text-xs text-foreground cursor-pointer"
                  >
                    <option value="trace">TRACE (Tất cả)</option>
                    <option value="debug">DEBUG (Gỡ lỗi)</option>
                    <option value="info">INFO (Thông tin)</option>
                    <option value="warn">WARN (Cảnh báo)</option>
                    <option value="error">ERROR (Lỗi)</option>
                    <option value="fatal">FATAL (Nghiêm trọng)</option>
                  </select>
                </div>

                {/* Retention Days */}
                <div className="flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border">
                  <div>
                    <span className="font-semibold text-foreground block">Thời gian lưu trữ tự động:</span>
                    <span className="text-[11px] text-foreground-secondary">Tự động xóa nhật ký quá hạn</span>
                  </div>
                  <select
                    value={form.logging?.retentionDays ?? 30}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        logging: { ...(form.logging || ({} as any)), retentionDays: Number(e.target.value) },
                      })
                    }
                    className="bg-surface-hover border border-border rounded-xl p-1.5 text-xs text-foreground cursor-pointer"
                  >
                    <option value={7}>7 ngày</option>
                    <option value={14}>14 ngày</option>
                    <option value={30}>30 ngày (Khuyến nghị)</option>
                    <option value={90}>90 ngày</option>
                    <option value={0}>Không bao giờ xóa (Never)</option>
                  </select>
                </div>

                {/* Max DB Size Limit */}
                <div className="flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border">
                  <div>
                    <span className="font-semibold text-foreground block">Dung lượng tối đa (MB):</span>
                    <span className="text-[11px] text-foreground-secondary">Tự động tỉa log cũ khi chạm ngưỡng</span>
                  </div>
                  <input
                    type="number"
                    min={10}
                    max={1000}
                    value={Math.round((form.logging?.maxDbSizeBytes || 100 * 1024 * 1024) / (1024 * 1024))}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        logging: {
                          ...(form.logging || ({} as any)),
                          maxDbSizeBytes: Math.max(10, Number(e.target.value)) * 1024 * 1024,
                        },
                      })
                    }
                    className="w-24 bg-surface-hover border border-border rounded-xl p-1.5 text-center font-mono text-foreground text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Performance & Module Metadata Switches */}
            <div className="p-6 bg-card border border-border rounded-3xl space-y-5 shadow-google-md text-xs">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-warning" />
                <span>Giám sát hiệu năng & Metadata tính năng</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Developer Mode Switch */}
                <div className="flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border">
                  <div>
                    <span className="font-semibold text-foreground block">Chế độ nhà phát triển:</span>
                    <span className="text-[11px] text-foreground-secondary">Bật ghi chép gỡ lỗi chi tiết toàn bộ app</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.logging?.developerMode ?? false}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        logging: { ...(form.logging || ({} as any)), developerMode: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                </div>

                {/* Console logging */}
                <div className="flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border">
                  <div>
                    <span className="font-semibold text-foreground block">Xuất log ra Console / Terminal:</span>
                    <span className="text-[11px] text-foreground-secondary">Hiển thị trong cửa sổ terminal Electron</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.logging?.enableConsole ?? true}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        logging: { ...(form.logging || ({} as any)), enableConsole: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                </div>

                {/* Performance Logging */}
                <div className="flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border">
                  <div>
                    <span className="font-semibold text-foreground block">Đo thời gian thực thi (Performance):</span>
                    <span className="text-[11px] text-foreground-secondary">Cảnh báo khi tác vụ vượt ngưỡng 1000ms</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.logging?.enablePerformance ?? true}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        logging: { ...(form.logging || ({} as any)), enablePerformance: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                </div>

                {/* AI Request Metadata */}
                <div className="flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border">
                  <div>
                    <span className="font-semibold text-foreground block">Ghi metadata cuộc gọi AI:</span>
                    <span className="text-[11px] text-foreground-secondary">Ghi lại model, token count (không lưu API key)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.logging?.enableAiMetadata ?? true}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        logging: { ...(form.logging || ({} as any)), enableAiMetadata: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                </div>

                {/* OCR Metadata */}
                <div className="flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border">
                  <div>
                    <span className="font-semibold text-foreground block">Ghi metadata OCR:</span>
                    <span className="text-[11px] text-foreground-secondary">Ghi số khối văn bản, độ phân giải (không lưu ảnh chụp)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.logging?.enableOcrMetadata ?? true}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        logging: { ...(form.logging || ({} as any)), enableOcrMetadata: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                </div>

                {/* Speech Metadata */}
                <div className="flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border">
                  <div>
                    <span className="font-semibold text-foreground block">Ghi metadata Voice / STT:</span>
                    <span className="text-[11px] text-foreground-secondary">Ghi thời lượng âm thanh (không lưu audio gốc)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.logging?.enableSpeechMetadata ?? true}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        logging: { ...(form.logging || ({} as any)), enableSpeechMetadata: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-2xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs shadow-google-md flex items-center gap-2 transition-all"
          >
            {isSaving ? <Check className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>{dict.settings.saveBtn}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
