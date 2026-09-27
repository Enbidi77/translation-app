import React, { useState, useEffect } from 'react';
import { X, Sliders, Eye, Move, Palette, Sparkles } from 'lucide-react';
import { TonePinyin } from '../components/common/TonePinyin';
import { useSettingsStore } from '../stores/useSettingsStore';
import { SubtitleThemeMode } from '../../shared/design/theme';

interface SubtitleEntry {
  original: string;
  pinyin?: string;
  translation: string;
}

export const SubtitleOverlay: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    fetchSettings, 
    initTheme, 
    effectiveTheme, 
    subtitleTheme, 
    setSubtitleTheme 
  } = useSettingsStore();

  const [currentEntry, setCurrentEntry] = useState<SubtitleEntry>({
    original: '你好，很高兴认识你！',
    pinyin: 'nǐ hǎo, hěn gāoxìng rènshí nǐ!',
    translation: 'Xin chào, rất vui được làm quen với bạn!',
  });

  const [clickThrough, setClickThrough] = useState(false);

  // Initialize theme, fetch settings, and fetch latest subtitle on mount
  useEffect(() => {
    fetchSettings();
    const unsubTheme = initTheme();

    // Fetch initial/latest subtitle entry from main process
    if (window.electronAPI?.getCurrentSubtitle) {
      window.electronAPI.getCurrentSubtitle().then((entry) => {
        if (entry && entry.original) {
          setCurrentEntry(entry);
        }
      });
    }

    // Subscribe to live subtitle stream
    const unsubscribe = window.electronAPI?.onSubtitleData((entry) => {
      if (entry) {
        setCurrentEntry(entry);
      }
    });

    return () => {
      unsubTheme?.();
      unsubscribe?.();
    };
  }, []);

  // Settings sync
  const fontSize = settings.subtitles?.fontSize || 22;
  const opacity = settings.subtitles?.opacity ?? 0.95;
  const showPinyin = settings.subtitles?.showPinyin ?? true;

  const handleClose = () => {
    if (window.electronAPI?.hideSubtitleOverlay) {
      window.electronAPI.hideSubtitleOverlay();
    } else {
      window.electronAPI?.close();
    }
  };

  const handleToggleClickThrough = () => {
    const next = !clickThrough;
    setClickThrough(next);
    window.electronAPI?.setClickThrough(next);
  };

  const handleCycleTheme = () => {
    const themeModes: SubtitleThemeMode[] = ['follow_app', 'dark', 'light', 'transparent'];
    const currentIdx = themeModes.indexOf(subtitleTheme);
    const nextMode = themeModes[(currentIdx + 1) % themeModes.length];
    setSubtitleTheme(nextMode);
  };

  const handleFontSizeChange = (delta: number) => {
    const newSize = Math.max(14, Math.min(36, fontSize + delta));
    updateSettings({
      subtitles: {
        ...settings.subtitles,
        fontSize: newSize,
      },
    });
  };

  const handleTogglePinyin = () => {
    updateSettings({
      subtitles: {
        ...settings.subtitles,
        showPinyin: !showPinyin,
      },
    });
  };

  const effectiveOverlayStyle = (() => {
    const resolved = subtitleTheme === 'follow_app' ? effectiveTheme : subtitleTheme;
    if (resolved === 'transparent') {
      return {
        container: 'bg-black/40 border-white/20 text-white backdrop-blur-[4px] shadow-none',
        header: 'text-white/80 border-white/10',
        originalText: 'text-white drop-shadow-[0_2px_6px_rgba(0,0,0,1)] [text-shadow:_0_1px_3px_rgb(0_0_0_/_90%),_0_0_8px_rgb(0_0_0)]',
        transText: 'text-emerald-300 drop-shadow-[0_2px_6px_rgba(0,0,0,1)] [text-shadow:_0_1px_3px_rgb(0_0_0_/_90%)]',
        badge: 'bg-black/50 text-white/90 border-white/30 hover:bg-black/70',
      };
    }
    if (resolved === 'light') {
      return {
        container: 'bg-white border-[#dadce0] text-[#202124] shadow-google-lg',
        header: 'text-[#5f6368] border-[#dadce0]',
        originalText: 'text-[#202124] drop-shadow-sm',
        transText: 'text-[#1e8e3e] font-semibold',
        badge: 'bg-[#f1f3f4] text-[#202124] border-[#dadce0] hover:bg-[#e8eaed]',
      };
    }
    // dark (default)
    return {
      container: 'bg-[#202124] border-[#3c4043] text-[#e8eaed] shadow-google-lg',
      header: 'text-[#9aa0a6] border-[#3c4043]',
      originalText: 'text-[#e8eaed] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]',
      transText: 'text-[#81c995] font-semibold',
      badge: 'bg-[#303134] text-[#e8eaed] border-[#3c4043] hover:bg-[#35363a]',
    };
  })();

  const themeLabelMap: Record<SubtitleThemeMode, string> = {
    follow_app: 'Theo App',
    dark: 'Tối',
    light: 'Sáng',
    transparent: 'Trong suốt',
  };

  return (
    <div
      className={`h-screen w-screen flex flex-col rounded-2xl border overflow-hidden select-none p-3 transition-all duration-150 ${effectiveOverlayStyle.container}`}
      style={{ opacity: subtitleTheme === 'transparent' ? 1.0 : opacity }}
    >
      {/* Header bar */}
      <div className={`h-6 flex items-center justify-between text-xs mb-1 titlebar-drag ${effectiveOverlayStyle.header}`}>
        <div className="flex items-center gap-2">
          <Move className="w-3.5 h-3.5 text-primary" />
          <span className="font-semibold text-[11px] tracking-wide">Phụ Đề Trực Tiếp</span>
          <button
            onClick={handleCycleTheme}
            className={`titlebar-no-drag px-2 py-0.5 rounded text-[10px] flex items-center gap-1 border transition-colors ${effectiveOverlayStyle.badge}`}
            title="Đổi giao diện phụ đề (Theo App / Tối / Sáng / Trong suốt)"
          >
            <Palette className="w-3 h-3 text-primary" />
            <span>{themeLabelMap[subtitleTheme]}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 titlebar-no-drag">
          <button
            onClick={handleTogglePinyin}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              showPinyin 
                ? 'bg-primary-muted text-primary border border-primary/40 font-semibold' 
                : 'bg-surface-hover text-muted-foreground'
            }`}
            title="Bật/Tắt Pinyin"
          >
            Pinyin
          </button>

          <div className="flex items-center gap-1 text-[10px]">
            <button
              onClick={() => handleFontSizeChange(-2)}
              className="px-1.5 py-0.5 rounded hover:bg-surface-hover text-muted-foreground hover:text-foreground font-bold"
              title="Giảm cỡ chữ"
            >
              A-
            </button>
            <span className="text-[10px] font-mono text-muted-foreground">{fontSize}px</span>
            <button
              onClick={() => handleFontSizeChange(2)}
              className="px-1.5 py-0.5 rounded hover:bg-surface-hover text-muted-foreground hover:text-foreground font-bold"
              title="Tăng cỡ chữ"
            >
              A+
            </button>
          </div>

          <button
            onClick={handleToggleClickThrough}
            className={`p-1 rounded text-xs transition-colors ${
              clickThrough ? 'bg-warning-muted text-warning' : 'hover:bg-surface-hover text-muted-foreground'
            }`}
            title={clickThrough ? 'Đang xuyên chuột' : 'Bật xuyên chuột (Click-through)'}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleClose}
            className="p-1 rounded text-muted-foreground hover:text-white hover:bg-destructive transition-colors"
            title="Đóng phụ đề"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subtitle Lines Display */}
      <div className="flex-1 flex flex-col justify-center items-center text-center px-4 space-y-1">
        {/* Original Text */}
        <div
          className={`font-bold tracking-wide transition-all line-clamp-2 ${effectiveOverlayStyle.originalText}`}
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.25 }}
        >
          {currentEntry.original || 'Đang chờ nhận diện giọng nói...'}
        </div>

        {/* Pinyin */}
        {showPinyin && currentEntry.pinyin && (
          <div className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            <TonePinyin pinyin={currentEntry.pinyin} className="text-xs md:text-sm font-medium" />
          </div>
        )}

        {/* Vietnamese Translation */}
        <div
          className={`font-medium transition-all line-clamp-2 ${effectiveOverlayStyle.transText}`}
          style={{ fontSize: `${Math.max(13, fontSize - 4)}px`, lineHeight: 1.25 }}
        >
          {currentEntry.translation || 'Bản dịch thời gian thực sẽ xuất hiện tại đây...'}
        </div>
      </div>
    </div>
  );
};
