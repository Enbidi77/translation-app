import React, { useState } from 'react';
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
  Subtitles
} from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useAppStore } from '../stores/useAppStore';
import { AppSettings } from '../../shared/types';
import { ThemeMode, SubtitleThemeMode } from '../../shared/design/theme';
import { ThemePreviewCard } from '../components/common/ThemePreviewCard';

export const SettingsPage: React.FC = () => {
  const { dict, settings, updateSettings, themeMode, setThemeMode, subtitleTheme, setSubtitleTheme, effectiveTheme } = useSettingsStore();
  const { showToast } = useAppStore();

  const [form, setForm] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'providers' | 'hotkeys' | 'privacy'>('appearance');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings(form);
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

            <div className="pt-4 border-t border-border space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.general.minimizeToTray}
                  onChange={(e) =>
                    setForm({ ...form, general: { ...form.general, minimizeToTray: e.target.checked } })
                  }
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
                <span className="text-foreground">
                  Thu nhỏ xuống khay hệ thống (System Tray) khi bấm nút đóng cửa sổ
                </span>
              </label>

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

            <div>
              <label className="block text-muted-foreground mb-1 font-medium">Nhà cung cấp dịch thuật chính:</label>
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
                <option value="deepl">DeepL Translation</option>
              </select>
            </div>

            {/* Gemini Settings */}
            <div className="p-4 bg-surface rounded-2xl border border-border space-y-3 shadow-google-sm">
              <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-warning" />
                <span>Google Gemini API (Khuyên dùng cho Gia sư AI & Phân tích câu)</span>
              </span>

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
              <span className="font-bold text-foreground text-sm">OpenAI API</span>
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
