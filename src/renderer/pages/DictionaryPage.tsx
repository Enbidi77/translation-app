import React, { useState, useEffect } from 'react';
import { Search, BookA, BookmarkPlus, Check, Volume2, Sparkles } from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useAppStore } from '../stores/useAppStore';
import { useVocabularyStore } from '../stores/useVocabularyStore';
import { VocabularyItem } from '../../shared/types';
import { TonePinyin } from '../components/common/TonePinyin';
import { AudioPlayer } from '../components/common/AudioPlayer';

export const DictionaryPage: React.FC = () => {
  const { dict } = useSettingsStore();
  const { showToast } = useAppStore();
  const { saveWord } = useVocabularyStore();

  const [query, setQuery] = useState('适合');
  const [results, setResults] = useState<VocabularyItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (searchTerm = query) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      if (window.electronAPI) {
        const found = await window.electronAPI.searchVocabulary(searchTerm.trim());
        setResults(found);
      }
    } catch (err) {
      console.error('Dictionary search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    handleSearch('适合');
  }, []);

  const handleSave = async (item: VocabularyItem) => {
    await saveWord(item);
    showToast(`Đã lưu "${item.word}" vào sổ từ vựng & tạo thẻ Flashcard!`, 'success');
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{dict.sidebar.dictionary}</h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          Tra cứu toàn diện chữ Hán, Pinyin, nghĩa tiếng Việt và tiếng Anh kèm ví dụ mẫu ngữ cảnh.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
          placeholder="Tìm kiếm: 适合, shìhé, phù hợp, beginner, character..."
          className="w-full bg-card border border-border rounded-2xl pl-12 pr-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-google-md"
        />
      </div>

      {/* Search Result Cards */}
      <div className="space-y-4">
        {results.length > 0 ? (
          results.map((item) => (
            <div
              key={item.id}
              className="p-5 bg-card border border-border rounded-3xl space-y-4 shadow-google-md hover:border-primary/40 transition-all"
            >
              <div className="flex items-start justify-between pb-3 border-b border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-foreground tracking-wide">{item.word}</span>
                    <AudioPlayer text={item.word} lang={item.language as any} size="md" />
                    <AudioPlayer text={item.word} lang={item.language as any} slow size="sm" />
                    {item.hskLevel && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-destructive-muted text-destructive border border-destructive/30 text-xs font-bold">
                        HSK {item.hskLevel}
                      </span>
                    )}
                    {item.cefrLevel && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-primary-muted text-primary border border-primary/30 text-xs font-bold">
                        CEFR {item.cefrLevel}
                      </span>
                    )}
                  </div>

                  {item.pinyin && (
                    <div className="text-sm">
                      <TonePinyin pinyin={item.pinyin} className="font-medium" />
                    </div>
                  )}
                  {item.ipa && (
                    <span className="text-xs font-mono text-muted-foreground">{item.ipa}</span>
                  )}
                </div>

                <button
                  onClick={() => handleSave(item)}
                  className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-google-sm transition-colors"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  <span>{dict.translate.saveVocab}</span>
                </button>
              </div>

              {/* Definitions & POS */}
              <div className="space-y-2 text-sm">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Định nghĩa:</span>
                  <span className="text-success font-bold text-base">{item.translation}</span>
                  {item.partOfSpeech && (
                    <span className="text-xs text-muted-foreground italic">({item.partOfSpeech})</span>
                  )}
                </div>

                {item.definition && (
                  <p className="text-xs text-foreground-secondary leading-relaxed bg-surface-hover p-3 rounded-xl border border-border">
                    {item.definition}
                  </p>
                )}
              </div>

              {/* Examples */}
              {item.examples && item.examples.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Ví dụ minh họa:
                  </span>
                  <div className="space-y-2">
                    {item.examples.map((ex, i) => (
                      <div key={i} className="p-3 bg-surface rounded-2xl border border-border space-y-1 shadow-google-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">{ex.sentence}</span>
                          <AudioPlayer text={ex.sentence} lang={item.language as any} size="sm" />
                        </div>
                        {ex.pinyin && <TonePinyin pinyin={ex.pinyin} className="text-xs" />}
                        <div className="text-xs text-success font-medium">{ex.translation}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-muted-foreground bg-card rounded-3xl border border-border shadow-google-sm">
            {isSearching ? 'Đang tra cứu từ điển...' : 'Không tìm thấy kết quả phù hợp. Hãy thử tìm từ khác.'}
          </div>
        )}
      </div>
    </div>
  );
};
