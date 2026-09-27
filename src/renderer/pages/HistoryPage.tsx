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
      screen: { label: 'Màn hình', color: 'bg-primary-muted text-primary border-primary/30' },
      ocr: { label: 'OCR', color: 'bg-primary-muted text-primary border-primary/30' },
      clipboard: { label: 'Bộ nhớ tạm', color: 'bg-warning-muted text-warning border-warning/30' },
      voice: { label: 'Giọng nói', color: 'bg-success-muted text-success border-success/30' },
      manual: { label: 'Nhập tay', color: 'bg-surface-hover text-foreground-secondary border-border' },
      subtitle: { label: 'Phụ đề', color: 'bg-primary-muted text-primary border-primary/30' },
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
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{dict.history.title}</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Lưu vết tất cả các phiên dịch từ màn hình, ảnh quét OCR, clipboard và đàm thoại.
          </p>
        </div>

        {historyItems.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-3.5 py-1.5 rounded-xl bg-surface hover:bg-destructive-muted text-muted-foreground hover:text-destructive border border-border hover:border-destructive/30 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-google-sm"
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
            className={`px-3.5 py-1.5 rounded-xl font-medium transition-colors shadow-google-sm ${
              filterType === f 
                ? 'bg-primary text-primary-foreground font-semibold' 
                : 'bg-card border border-border text-foreground-secondary hover:text-foreground hover:bg-surface-hover'
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
            className="p-5 bg-card border border-border rounded-3xl space-y-2.5 shadow-google-md hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
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
                <div className="text-base font-bold text-foreground leading-snug">
                  {item.sourceText}
                </div>
                {item.pinyin && <TonePinyin pinyin={item.pinyin} className="text-xs" />}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <AudioPlayer text={item.sourceText} lang={item.sourceLang as any} size="sm" />
                <button
                  onClick={() => item.id && handleCopy(item.id, item.targetText)}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-hover border border-border transition-colors"
                  title="Sao chép"
                >
                  {copiedId === item.id ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleSaveToVocab(item)}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-surface-hover border border-border transition-colors"
                  title="Lưu vào từ vựng"
                >
                  <BookmarkPlus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Translation */}
            <div className="pt-2 border-t border-border text-sm font-semibold text-success">
              {item.targetText}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-12 text-center text-muted-foreground bg-card rounded-3xl border border-border shadow-google-sm">
            {dict.history.empty}
          </div>
        )}
      </div>
    </div>
  );
};
