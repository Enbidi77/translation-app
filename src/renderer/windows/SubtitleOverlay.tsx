import React, { useState, useEffect } from 'react';
import { X, Sliders, Eye, Move, Palette } from 'lucide-react';
import { TonePinyin } from '../components/common/TonePinyin';
import { useSettingsStore } from '../stores/useSettingsStore';
import { SubtitleThemeMode } from '../../shared/design/theme';

interface SubtitleEntry {
  original: string;
  pinyin?: string;
  translation: string;
}

export const SubtitleOverlay: React.FC = () => {
  const [currentEntry, setCurrentEntry] = useState<SubtitleEntry>({
    original: '这个游戏的操作非常简单。',
    pinyin: 'Zhège yóuxì de cāozuò fēicháng jiǎndān.',
    translation: 'Cách điều khiển của trò chơi này rất đơn giản.',
  });
  const [showPinyin, setShowPinyin] = useState(true);
  const [fontSize, setFontSize] = useState(20);
  const [opacity, setOpacity] = useState(1.0);
  const [clickThrough, setClickThrough] = useState(false);

  const { effectiveTheme, subtitleTheme, setSubtitleTheme } = useSettingsStore();

  useEffect(() => {
    const unsubscribe = window.electronAPI?.onSubtitleData((entry) => {
      setCurrentEntry(entry);
    });
    return () => unsubscribe?.();
  }, []);

  const handleClose = () => {
    window.electronAPI?.close();
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

  const effectiveOverlayStyle = (() => {
    const resolved = subtitleTheme === 'follow_app' ? effectiveTheme : subtitleTheme;
    if (resolved === 'transparent') {
      return {
        container: 'bg-black/20 border-white/20 text-white backdrop-blur-[2px] shadow-none',
        header: 'text-white/80',
        originalText: 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] [text-shadow:_0_1px_3px_rgb(0_0_0_/_90%),_0_0_8px_rgb(0_0_0)]',
        transText: 'text-emerald-300 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] [text-shadow:_0_1px_3px_rgb(0_0_0_/_90%)]',
        badge: 'bg-black/40 text-white/90 border-white/30',
      };
    }
    if (resolved === 'light') {
      return {
        container: 'bg-white border-[#dadce0] text-[#202124] shadow-google-lg',
        header: 'text-[#5f6368]',
        originalText: 'text-[#202124] drop-shadow-sm',
        transText: 'text-[#1e8e3e] font-semibold',
        badge: 'bg-[#f1f3f4] text-[#202124] border-[#dadce0]',
      };
    }
    // dark
    return {
      container: 'bg-[#202124] border-[#3c4043] text-[#e8eaed] shadow-google-lg',
      header: 'text-[#9aa0a6]',
      originalText: 'text-[#e8eaed] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]',
      transText: 'text-[#81c995] font-semibold',
      badge: 'bg-[#303134] text-[#e8eaed] border-[#3c4043]',
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
          <span className="font-semibold text-[11px]">Phụ Đề Trực Tiếp</span>
          <button
            onClick={handleCycleTheme}
            className={`titlebar-no-drag px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 border transition-colors ${effectiveOverlayStyle.badge}`}
            title="Đổi giao diện phụ đề (Theo App / Tối / Sáng / Trong suốt)"
          >
            <Palette className="w-3 h-3 text-primary" />
            <span>{themeLabelMap[subtitleTheme]}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 titlebar-no-drag">
          <button
            onClick={() => setShowPinyin(!showPinyin)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
              showPinyin 
                ? 'bg-primary-muted text-primary border border-primary/40 font-semibold' 
                : 'bg-surface-hover text-muted-foreground'
            }`}
          >
            Pinyin
          </button>

          <div className="flex items-center gap-1 text-[10px]">
            <span>A</span>
            <input
              type="range"
              min="14"
              max="32"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-12 h-1 accent-primary cursor-pointer"
            />
            <span className="text-xs font-bold">A</span>
          </div>

          <button
            onClick={handleToggleClickThrough}
            className={`p-1 rounded text-xs transition-colors ${
              clickThrough ? 'bg-warning-muted text-warning' : 'hover:bg-surface-hover text-muted-foreground'
            }`}
            title="Xuyên chuột (Click-through)"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleClose}
            className="p-1 rounded text-muted-foreground hover:text-white hover:bg-destructive transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subtitle Lines */}
      <div className="flex-1 flex flex-col justify-center items-center text-center px-4 space-y-1">
        {/* Original Text */}
        <div
          className={`font-bold tracking-wide transition-all ${effectiveOverlayStyle.originalText}`}
          style={{ fontSize: `${fontSize}px` }}
        >
          {currentEntry.original}
        </div>

        {/* Pinyin */}
        {showPinyin && currentEntry.pinyin && (
          <div className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            <TonePinyin pinyin={currentEntry.pinyin} className="text-xs md:text-sm font-medium" />
          </div>
        )}

        {/* Vietnamese Translation */}
        <div
          className={`font-medium transition-all ${effectiveOverlayStyle.transText}`}
          style={{ fontSize: `${Math.max(12, fontSize - 4)}px` }}
        >
          {currentEntry.translation}
        </div>
      </div>
    </div>
  );
};
