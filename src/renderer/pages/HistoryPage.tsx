import React, { useState, useEffect } from 'react';
import { 
  History, 
  Trash2, 
  Copy, 
  Check, 
  Volume2, 
  Clock, 
  Filter,
  BookmarkPlus
} from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useAppStore } from '../stores/useAppStore';
import { useVocabularyStore } from '../stores/useVocabularyStore';
import { TranslationHistoryItem } from '../../shared/types';
import { TonePinyin } from '../components/common/TonePinyin';
import { AudioPlayer } from '../components/common/AudioPlayer';

export const HistoryPage: React.FC = () => {
  const { dict } = useSettingsStore();
  const { showToast } = useAppStore();
  const { saveWord } = useVocabularyStore();

  const [historyItems, setHistoryItems] = useState<TranslationHistoryItem[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const loadHistory = async () => {
    if (window.electronAPI) {
      try {
        const items = await window.electronAPI.getHistory(100);
        setHistoryItems(items);
      } catch (err) {
        console.error('Failed to load history:', err);
      }
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClearAll = async () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử dịch thuật?')) {
      if (window.electronAPI) {
        await window.electronAPI.clearHistory();
        setHistoryItems([]);
        showToast('Đã xóa toàn bộ lịch sử tra cứu!', 'info');
      }
    }
  };

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(dict.translate.copySuccess, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToVocab = async (item: TranslationHistoryItem) => {
    await saveWord({
      word: item.sourceText,
      language: item.sourceLang as any,
      translation: item.targetText,
      pinyin: item.pinyin,
      source: `history_${item.sourceType}`,
    });
    showToast(`Đã lưu "${item.sourceText}" vào sổ từ vựng!`, 'success');
  };

  const getSourceBadge = (type: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      screen: { label: 'Màn hình', color: 'bg-primary/20 text-primary border-primary/30' },
      ocr: { label: 'OCR', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
      clipboard: { label: 'Bộ nhớ tạm', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
      voice: { label: 'Giọng nói', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
      manual: { label: 'Nhập tay', color: 'bg-slate-800 text-slate-400 border-slate-700' },
      subtitle: { label: 'Phụ đề', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    };
    const b = badges[type] || badges.manual;
    return (
      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase ${b.color}`}>
        {b.label}
      </span>
    );
  };

  const filtered = filterType === 'all' 
    ? historyItems 
    : historyItems.filter((i) => i.sourceType === filterType);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{dict.history.title}</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Lưu vết tất cả các phiên dịch từ màn hình, ảnh quét OCR, clipboard và đàm thoại.
          </p>
        </div>

        {historyItems.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-red-950/60 text-slate-400 hover:text-red-300 border border-slate-800 hover:border-red-800/60 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{dict.history.clearAll}</span>
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 text-xs">
        {['all', 'screen', 'ocr', 'voice', 'manual', 'clipboard'].map((f) => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              filterType === f ? 'bg-primary text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {f === 'all' ? 'Tất cả' : f === 'screen' ? 'Màn hình' : f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* History Items List */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2.5 shadow-xl hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                {getSourceBadge(item.sourceType)}
                <span className="font-mono text-[11px] uppercase">
                  {item.sourceLang} ➔ {item.targetLang}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <Clock className="w-3 h-3" />
                <span>{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : 'Vừa xong'}</span>
              </div>
            </div>

            {/* Original Text */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-base font-semibold text-white leading-snug">
                  {item.sourceText}
                </div>
                {item.pinyin && <TonePinyin pinyin={item.pinyin} className="text-xs" />}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <AudioPlayer text={item.sourceText} lang={item.sourceLang as any} size="sm" />
                <button
                  onClick={() => item.id && handleCopy(item.id, item.targetText)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  title="Sao chép"
                >
                  {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleSaveToVocab(item)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-800"
                  title="Lưu vào từ vựng"
                >
                  <BookmarkPlus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Translation */}
            <div className="pt-2 border-t border-slate-800/80 text-sm font-medium text-emerald-300">
              {item.targetText}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
            {dict.history.empty}
          </div>
        )}
      </div>
    </div>
  );
};
