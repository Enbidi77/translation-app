import React, { useState, useEffect } from 'react';
import { 
  X, 
  Pin, 
  PinOff, 
  Eye, 
  BookmarkPlus, 
  Sparkles, 
  Move, 
  Check, 
  Sliders 
} from 'lucide-react';
import { TranslationResponse, WordToken } from '../../shared/types';
import { TonePinyin } from '../components/common/TonePinyin';
import { AudioPlayer } from '../components/common/AudioPlayer';
import { WordBreakdownModal } from '../components/common/WordBreakdownModal';
import { useAppStore } from '../stores/useAppStore';

export const FloatingOverlay: React.FC = () => {
  const [data, setData] = useState<TranslationResponse | null>(null);
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);
  const [clickThrough, setClickThrough] = useState(false);
  const [opacity, setOpacity] = useState(0.95);
  const [savedWords, setSavedWords] = useState<Record<string, boolean>>({});
  const { openWordModal } = useAppStore();

  useEffect(() => {
    const unsubscribe = window.electronAPI?.onOverlayData((newData) => {
      setData(newData);
    });
    return () => unsubscribe?.();
  }, []);

  const handleTogglePin = () => {
    const next = !alwaysOnTop;
    setAlwaysOnTop(next);
    window.electronAPI?.setAlwaysOnTop(next);
  };

  const handleToggleClickThrough = () => {
    const next = !clickThrough;
    setClickThrough(next);
    window.electronAPI?.setClickThrough(next);
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setOpacity(val);
    window.electronAPI?.setOpacity(val);
  };

  const handleClose = () => {
    window.electronAPI?.close();
  };

  const handleSaveWord = async (token: WordToken) => {
    if (window.electronAPI) {
      await window.electronAPI.saveVocabulary({
        word: token.word,
        language: /[\u4e00-\u9fa5]/.test(token.word) ? 'zh' : 'en',
        translation: token.translation || 'Từ vựng đã lưu',
        pinyin: token.pinyin,
        partOfSpeech: token.partOfSpeech,
        hskLevel: token.hskLevel as any,
        source: 'screen_overlay',
      });
      setSavedWords((prev) => ({ ...prev, [token.word]: true }));
    }
  };

  if (!data) {
    return (
      <div className="h-screen w-screen bg-slate-900/90 text-slate-300 p-4 flex items-center justify-center text-xs">
        Đang chờ kết quả dịch...
      </div>
    );
  }

  const isZh = data.sourceLang === 'zh' || /[\u4e00-\u9fa5]/.test(data.sourceText);

  return (
    <div
      className="h-screen w-screen flex flex-col bg-slate-950/95 text-slate-100 rounded-xl border border-slate-700/80 shadow-2xl overflow-hidden backdrop-blur-md select-none"
      style={{ opacity }}
    >
      {/* Draggable Header */}
      <div className="h-9 px-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs titlebar-drag">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
          <Move className="w-3.5 h-3.5 text-primary" />
          <span>Dịch Màn Hình</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/20 text-primary border border-primary/30 uppercase font-mono">
            {data.sourceLang} → {data.targetLang}
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1 titlebar-no-drag">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800/80 text-[10px]">
            <Sliders className="w-3 h-3 text-slate-400" />
            <input
              type="range"
              min="0.3"
              max="1.0"
              step="0.05"
              value={opacity}
              onChange={handleOpacityChange}
              className="w-12 h-1 accent-primary cursor-pointer"
              title="Độ trong suốt cửa sổ"
            />
          </div>

          <button
            onClick={handleTogglePin}
            className={`p-1 rounded transition-colors ${alwaysOnTop ? 'text-primary bg-primary/10' : 'text-slate-400 hover:bg-slate-800'}`}
            title={alwaysOnTop ? 'Ghim trên cùng' : 'Bỏ ghim'}
          >
            {alwaysOnTop ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-red-600 transition-colors"
            title="Đóng cửa sổ"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-3.5 space-y-3 overflow-y-auto">
        {/* Source Text with clickable words */}
        <div className="p-3 bg-slate-900/70 border border-slate-800/80 rounded-lg space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Nguyên văn:</span>
            <div className="flex items-center gap-1">
              <AudioPlayer text={data.sourceText} lang={isZh ? 'zh' : 'en'} size="sm" />
              <AudioPlayer text={data.sourceText} lang={isZh ? 'zh' : 'en'} slow size="sm" />
            </div>
          </div>

          <div className="text-lg font-medium leading-relaxed flex flex-wrap gap-1">
            {data.words && data.words.length > 0 ? (
              data.words.map((w, idx) => (
                <span
                  key={idx}
                  onClick={() => openWordModal(w)}
                  className="cursor-pointer hover:bg-primary/20 hover:text-primary px-1 py-0.5 rounded transition-colors underline decoration-dotted decoration-slate-600 underline-offset-4"
                  title={`Bấm để xem định nghĩa: ${w.word}`}
                >
                  {w.word}
                </span>
              ))
            ) : (
              <span>{data.sourceText}</span>
            )}
          </div>

          {/* Pinyin with tones */}
          {data.pinyin && (
            <div className="pt-1 border-t border-slate-800/50">
              <TonePinyin pinyin={data.pinyin} className="text-xs" />
            </div>
          )}
        </div>

        {/* Vietnamese Translation */}
        <div className="p-3 bg-emerald-950/20 border border-emerald-800/30 rounded-lg space-y-1">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Tiếng Việt:</span>
          <p className="text-sm font-medium text-emerald-200 leading-relaxed">
            {data.translatedText}
          </p>
        </div>

        {/* Vocabulary Token Chips */}
        {data.words && data.words.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Từ vựng quan trọng (bấm để xem & lưu):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {data.words.slice(0, 8).map((w, idx) => {
                const saved = savedWords[w.word];
                return (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900 border border-slate-700/80 text-xs"
                  >
                    <span 
                      onClick={() => openWordModal(w)}
                      className="cursor-pointer hover:text-primary font-medium"
                    >
                      {w.word}
                    </span>
                    {w.pinyin && <span className="text-[10px] text-slate-400">({w.pinyin})</span>}
                    <button
                      onClick={() => handleSaveWord(w)}
                      className={`p-0.5 rounded hover:bg-slate-800 transition-colors ${saved ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}
                      title={saved ? 'Đã lưu' : 'Lưu vào từ vựng'}
                    >
                      {saved ? <Check className="w-3 h-3" /> : <BookmarkPlus className="w-3 h-3" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Global Word Modal inside Overlay */}
      <WordBreakdownModal />
    </div>
  );
};
