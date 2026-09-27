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
  Info
} from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useAppStore } from '../stores/useAppStore';
import { AppSettings } from '../../shared/types';

export const SettingsPage: React.FC = () => {
  const { dict, settings, updateSettings } = useSettingsStore();
  const { showToast } = useAppStore();

  const [form, setForm] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<'general' | 'providers' | 'hotkeys' | 'subtitles' | 'privacy'>('general');
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

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{dict.settings.title}</h1>
        <p className="text-slate-400 text-xs mt-0.5">
          Tùy chỉnh nhà cung cấp AI, phím tắt toàn hệ thống, cửa sổ phụ đề và quyền riêng tư dữ liệu.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'general' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            {dict.settings.general}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('providers')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'providers' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            {dict.settings.providers}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hotkeys')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'hotkeys' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            {dict.settings.hotkeys}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('subtitles')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'subtitles' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            {dict.settings.appearance}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'privacy' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            {dict.settings.privacy}
          </button>
        </div>

        {/* Tab 1: General */}
        {activeTab === 'general' && (
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-white mb-2">Ngôn ngữ mặc định của người học</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Ngôn ngữ mẹ đẻ:</label>
                <select
                  value={form.general.nativeLanguage}
                  onChange={(e) =>
                    setForm({ ...form, general: { ...form.general, nativeLanguage: e.target.value as any } })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="vi">Tiếng Việt (Mặc định)</option>
                  <option value="en">English</option>
                  <option value="zh">简体中文</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Mục tiêu học tập chính:</label>
                <select
                  value={form.general.primaryTarget}
                  onChange={(e) =>
                    setForm({ ...form, general: { ...form.general, primaryTarget: e.target.value as any } })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="zh">Tiếng Trung Giản Thể (HSK)</option>
                  <option value="en">Tiếng Anh (CEFR)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.general.minimizeToTray}
                  onChange={(e) =>
                    setForm({ ...form, general: { ...form.general, minimizeToTray: e.target.checked } })
                  }
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
                <span className="text-slate-200">
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
                <span className="text-slate-200">
                  Tự động nhận diện và gợi ý dịch khi sao chép văn bản tiếng Trung / tiếng Anh (Clipboard Watcher)
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Tab 2: Providers */}
        {activeTab === 'providers' && (
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-5 shadow-xl text-xs">
            <div className="p-3.5 bg-blue-950/30 border border-blue-800/40 rounded-2xl flex items-center gap-2.5 text-blue-200">
              <Info className="w-5 h-5 text-primary shrink-0" />
              <span>
                Hệ thống tích hợp sẵn <strong>Google Dịch Miễn Phí</strong> & <strong>Tesseract OCR</strong> chạy ngay mà không bắt buộc có API Key. Thêm API Key dưới đây để mở khóa phân tích ngữ pháp AI thông minh hơn.
              </span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Nhà cung cấp dịch thuật chính:</label>
              <select
                value={form.providers.translationProvider}
                onChange={(e) =>
                  setForm({ ...form, providers: { ...form.providers, translationProvider: e.target.value as any } })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
              >
                <option value="google_free">Google Dịch (Miễn phí, không cần Key)</option>
                <option value="gemini">Google Gemini AI</option>
                <option value="openai">OpenAI (GPT-4o Mini)</option>
                <option value="deepl">DeepL Translation</option>
              </select>
            </div>

            {/* Gemini Settings */}
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
              <span className="font-bold text-white text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Google Gemini API (Khuyên dùng cho Gia sư AI & Phân tích câu)</span>
              </span>

              <div>
                <label className="block text-slate-400 mb-1">Gemini API Key:</label>
                <input
                  type="password"
                  value={form.providers.geminiApiKey}
                  onChange={(e) =>
                    setForm({ ...form, providers: { ...form.providers, geminiApiKey: e.target.value } })
                  }
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Model:</label>
                <input
                  type="text"
                  value={form.providers.geminiModel}
                  onChange={(e) =>
                    setForm({ ...form, providers: { ...form.providers, geminiModel: e.target.value } })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>
            </div>

            {/* OpenAI Settings */}
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
              <span className="font-bold text-white text-sm">OpenAI API</span>
              <div>
                <label className="block text-slate-400 mb-1">OpenAI API Key:</label>
                <input
                  type="password"
                  value={form.providers.openaiApiKey}
                  onChange={(e) =>
                    setForm({ ...form, providers: { ...form.providers, openaiApiKey: e.target.value } })
                  }
                  placeholder="sk-proj-..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Hotkeys */}
        {activeTab === 'hotkeys' && (
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-white mb-2">Phím tắt toàn cầu (Global Hotkeys)</h3>
            <p className="text-slate-400">
              Các phím tắt này hoạt động trên toàn bộ hệ thống Windows kể cả khi đang chơi game full-screen hoặc duyệt web.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-medium text-slate-200">Dịch màn hình (Screen Translate):</span>
                <input
                  type="text"
                  value={form.hotkeys.screenTranslate}
                  onChange={(e) =>
                    setForm({ ...form, hotkeys: { ...form.hotkeys, screenTranslate: e.target.value } })
                  }
                  className="w-60 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center font-mono text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-medium text-slate-200">Quét chữ OCR (OCR Capture):</span>
                <input
                  type="text"
                  value={form.hotkeys.ocrCapture}
                  onChange={(e) =>
                    setForm({ ...form, hotkeys: { ...form.hotkeys, ocrCapture: e.target.value } })
                  }
                  className="w-60 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center font-mono text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-medium text-slate-200">Bật / Tắt phụ đề nổi (Subtitle Mode):</span>
                <input
                  type="text"
                  value={form.hotkeys.subtitleMode}
                  onChange={(e) =>
                    setForm({ ...form, hotkeys: { ...form.hotkeys, subtitleMode: e.target.value } })
                  }
                  className="w-60 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center font-mono text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-medium text-slate-200">Dịch giọng nói trực tiếp (Live Voice):</span>
                <input
                  type="text"
                  value={form.hotkeys.liveVoice}
                  onChange={(e) =>
                    setForm({ ...form, hotkeys: { ...form.hotkeys, liveVoice: e.target.value } })
                  }
                  className="w-60 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center font-mono text-white text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Subtitles Appearance */}
        {activeTab === 'subtitles' && (
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-white mb-2">Tùy biến hiển thị phụ đề nổi</h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
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
                <div className="flex justify-between text-slate-300 mb-1">
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

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.subtitles.showPinyin}
                  onChange={(e) =>
                    setForm({ ...form, subtitles: { ...form.subtitles, showPinyin: e.target.checked } })
                  }
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
                <span className="text-slate-200">Hiển thị phiên âm Pinyin phía trên bản dịch</span>
              </label>
            </div>
          </div>
        )}

        {/* Tab 5: Privacy */}
        {activeTab === 'privacy' && (
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Quyền riêng tư & Bảo mật dữ liệu</span>
            </h3>

            <div className="space-y-3 leading-relaxed text-slate-300">
              <p>
                PolyglotDesktop được thiết kế theo kiến trúc <strong>Local-First</strong> (Ưu tiên dữ liệu cục bộ).
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
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
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-blue-600 text-white font-medium text-xs shadow-lg shadow-primary/20 flex items-center gap-2 transition-all"
          >
            {isSaving ? <Check className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>{dict.settings.saveBtn}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
