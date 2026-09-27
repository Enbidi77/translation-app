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
        <h1 className="text-2xl font-bold text-white tracking-tight">{dict.sidebar.dictionary}</h1>
        <p className="text-slate-400 text-xs mt-0.5">
          Tra cứu toàn diện chữ Hán, Pinyin, nghĩa tiếng Việt và tiếng Anh kèm ví dụ mẫu ngữ cảnh.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
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
          className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-base text-white placeholder-slate-500 focus:outline-none focus:border-primary shadow-xl"
        />
      </div>

      {/* Search Result Cards */}
      <div className="space-y-4">
        {results.length > 0 ? (
          results.map((item) => (
            <div
              key={item.id}
              className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4 shadow-xl hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-white tracking-wide">{item.word}</span>
                    <AudioPlayer text={item.word} lang={item.language as any} size="md" />
                    <AudioPlayer text={item.word} lang={item.language as any} slow size="sm" />
                    {item.hskLevel && (
                      <span className="px-2 py-0.5 rounded-md bg-red-950/60 text-red-300 border border-red-800/50 text-xs font-semibold">
                        HSK {item.hskLevel}
                      </span>
                    )}
                    {item.cefrLevel && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-950/60 text-blue-300 border border-blue-800/50 text-xs font-semibold">
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
                    <span className="text-xs font-mono text-slate-400">{item.ipa}</span>
                  )}
                </div>

                <button
                  onClick={() => handleSave(item)}
                  className="px-3 py-1.5 rounded-xl bg-primary hover:bg-blue-600 text-white text-xs font-medium flex items-center gap-1.5 shadow transition-colors"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  <span>{dict.translate.saveVocab}</span>
                </button>
              </div>

              {/* Definitions & POS */}
              <div className="space-y-2 text-sm">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Định nghĩa:</span>
                  <span className="text-emerald-400 font-semibold text-base">{item.translation}</span>
                  {item.partOfSpeech && (
                    <span className="text-xs text-slate-400 italic">({item.partOfSpeech})</span>
                  )}
                </div>

                {item.definition && (
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    {item.definition}
                  </p>
                )}
              </div>

              {/* Examples */}
              {item.examples && item.examples.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Ví dụ minh họa:
                  </span>
                  <div className="space-y-2">
                    {item.examples.map((ex, i) => (
                      <div key={i} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">{ex.sentence}</span>
                          <AudioPlayer text={ex.sentence} lang={item.language as any} size="sm" />
                        </div>
                        {ex.pinyin && <TonePinyin pinyin={ex.pinyin} className="text-xs" />}
                        <div className="text-xs text-emerald-300 font-medium">{ex.translation}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
            {isSearching ? 'Đang tra cứu từ điển...' : 'Không tìm thấy kết quả phù hợp. Hãy thử tìm từ khác.'}
          </div>
        )}
      </div>
    </div>
  );
};
