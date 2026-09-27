import React, { useState, useEffect } from 'react';
import { X, Sliders, Eye, Move, Volume2 } from 'lucide-react';
import { TonePinyin } from '../components/common/TonePinyin';

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
  const [opacity, setOpacity] = useState(0.9);
  const [clickThrough, setClickThrough] = useState(false);

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

  return (
    <div
      className="h-screen w-screen flex flex-col bg-slate-950/90 text-white rounded-xl border border-slate-700/60 shadow-2xl overflow-hidden backdrop-blur-md select-none p-3"
      style={{ opacity }}
    >
      {/* Header bar */}
      <div className="h-6 flex items-center justify-between text-xs text-slate-400 mb-1 titlebar-drag">
        <div className="flex items-center gap-2">
          <Move className="w-3.5 h-3.5 text-primary" />
          <span className="font-semibold text-[11px] text-slate-200">Phụ Đề Trực Tiếp</span>
        </div>

        <div className="flex items-center gap-2 titlebar-no-drag">
          <button
            onClick={() => setShowPinyin(!showPinyin)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
              showPinyin ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-slate-800 text-slate-400'
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
              clickThrough ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-slate-800 text-slate-400'
            }`}
            title="Xuyên chuột (Click-through)"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-red-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subtitle Lines */}
      <div className="flex-1 flex flex-col justify-center items-center text-center px-4 space-y-1">
        {/* Original Text */}
        <div
          className="font-bold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-slate-100"
          style={{ fontSize: `${fontSize}px` }}
        >
          {currentEntry.original}
        </div>

        {/* Pinyin */}
        {showPinyin && currentEntry.pinyin && (
          <div className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            <TonePinyin pinyin={currentEntry.pinyin} className="text-xs md:text-sm" />
          </div>
        )}

        {/* Vietnamese Translation */}
        <div
          className="font-medium text-emerald-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          style={{ fontSize: `${Math.max(12, fontSize - 4)}px` }}
        >
          {currentEntry.translation}
        </div>
      </div>
    </div>
  );
};
