import React, { useState } from 'react';
import { X, BookmarkPlus, Check, Sparkles, BookOpen } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useVocabularyStore } from '../../stores/useVocabularyStore';
import { TonePinyin } from './TonePinyin';
import { AudioPlayer } from './AudioPlayer';

export const WordBreakdownModal: React.FC = () => {
  const { selectedWord, isWordModalOpen, closeWordModal, showToast } = useAppStore();
  const { saveWord } = useVocabularyStore();
  const [isSaved, setIsSaved] = useState(false);
  const [grammarExplanation, setGrammarExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  if (!isWordModalOpen || !selectedWord) return null;

  const handleSave = async () => {
    const isZh = /[\u4e00-\u9fa5]/.test(selectedWord.word);
    await saveWord({
      word: selectedWord.word,
      language: isZh ? 'zh' : 'en',
      translation: selectedWord.translation || 'Từ mới',
      pinyin: selectedWord.pinyin,
      partOfSpeech: selectedWord.partOfSpeech,
      hskLevel: selectedWord.hskLevel as any,
      source: 'screen_selection',
    });
    setIsSaved(true);
    showToast(`Đã lưu "${selectedWord.word}" vào sổ từ vựng & tạo thẻ Flashcard!`, 'success');
  };

  const handleExplain = async () => {
    setIsExplaining(true);
    try {
      if (window.electronAPI) {
        const res = await window.electronAPI.explainGrammar({ text: selectedWord.word });
        setGrammarExplanation(res.explanation);
      }
    } catch (err: any) {
      setGrammarExplanation('Không thể lấy phân tích ngữ pháp vào lúc này.');
    } finally {
      setIsExplaining(false);
    }
  };

  const isZh = /[\u4e00-\u9fa5]/.test(selectedWord.word);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold text-white tracking-wide">{selectedWord.word}</h2>
              <AudioPlayer text={selectedWord.word} lang={isZh ? 'zh' : 'en'} size="md" />
              <AudioPlayer text={selectedWord.word} lang={isZh ? 'zh' : 'en'} slow size="sm" />
            </div>
            {selectedWord.pinyin && (
              <div className="mt-1">
                <TonePinyin pinyin={selectedWord.pinyin} className="text-sm" />
              </div>
            )}
          </div>
          <button
            onClick={closeWordModal}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Ý nghĩa tiếng Việt:</span>
            <p className="text-emerald-400 font-medium text-base mt-0.5">
              {selectedWord.translation || 'Chưa có định nghĩa sẵn'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {selectedWord.partOfSpeech && (
              <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {selectedWord.partOfSpeech}
              </span>
            )}
            {selectedWord.hskLevel && (
              <span className="px-2.5 py-1 rounded-md bg-blue-900/60 text-blue-300 border border-blue-700/50">
                HSK {selectedWord.hskLevel}
              </span>
            )}
          </div>

          {grammarExplanation && (
            <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-lg text-xs leading-relaxed text-slate-200 max-h-48 overflow-y-auto whitespace-pre-line">
              {grammarExplanation}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={handleExplain}
            disabled={isExplaining}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {isExplaining ? 'Đang phân tích...' : 'Giải thích ngữ pháp'}
          </button>

          <button
            onClick={handleSave}
            disabled={isSaved}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isSaved
                ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/50'
                : 'bg-primary hover:bg-blue-600 text-white shadow'
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
            {isSaved ? 'Đã lưu' : 'Lưu từ vựng'}
          </button>
        </div>
      </div>
    </div>
  );
};
