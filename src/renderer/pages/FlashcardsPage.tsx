import React, { useEffect } from 'react';
import { 
  Layers, 
  RotateCw, 
  CheckCircle2, 
  Volume2, 
  Sparkles, 
  Flame,
  Award
} from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useFlashcardStore } from '../stores/useFlashcardStore';
import { FlashcardRating } from '../../shared/types';
import { TonePinyin } from '../components/common/TonePinyin';
import { AudioPlayer } from '../components/common/AudioPlayer';

export const FlashcardsPage: React.FC = () => {
  const { dict } = useSettingsStore();
  const { 
    dueCards, 
    currentIndex, 
    isFlipped, 
    isLoading, 
    stats, 
    fetchDueCards, 
    flipCard, 
    reviewCurrentCard 
  } = useFlashcardStore();

  useEffect(() => {
    fetchDueCards();
  }, []);

  // Keyboard navigation: Space to flip, 1-4 to rate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        flipCard();
      } else if (isFlipped) {
        if (e.key === '1') reviewCurrentCard(1);
        if (e.key === '2') reviewCurrentCard(2);
        if (e.key === '3') reviewCurrentCard(3);
        if (e.key === '4') reviewCurrentCard(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentIndex, dueCards]);

  const currentCard = dueCards[currentIndex];

  const handleRating = (rating: FlashcardRating) => {
    reviewCurrentCard(rating);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{dict.flashcards.title}</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Thuật toán SuperMemo SM-2 tối ưu hóa khoảng thời gian ôn tập để ghi nhớ lâu dài.
          </p>
        </div>

        {/* Stats Pill */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
          <Layers className="w-4 h-4 text-primary" />
          <span className="text-slate-300">Cần ôn tập:</span>
          <span className="font-bold text-amber-400">{dueCards.length - currentIndex} thẻ</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-900 border border-slate-800 h-2.5 rounded-full overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-300 rounded-full"
          style={{
            width: `${dueCards.length > 0 ? (currentIndex / dueCards.length) * 100 : 100}%`,
          }}
        />
      </div>

      {/* Main Flashcard Container */}
      {currentCard ? (
        <div className="space-y-6">
          <div
            onClick={flipCard}
            className={`min-h-[340px] rounded-3xl p-8 flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-300 border shadow-2xl relative select-none ${
              isFlipped
                ? 'bg-slate-900/95 border-primary/50 shadow-primary/10'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            {/* Header info */}
            <div className="w-full flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono">Thẻ {currentIndex + 1} / {dueCards.length}</span>
              <div className="flex items-center gap-1.5">
                <span className="capitalize px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                  {currentCard.state}
                </span>
                {currentCard.vocabulary?.hskLevel && (
                  <span className="px-2 py-0.5 rounded-full bg-red-950/60 text-red-300 border border-red-800/40 text-[10px] font-bold">
                    HSK {currentCard.vocabulary.hskLevel}
                  </span>
                )}
              </div>
            </div>

            {/* Front & Back Content */}
            <div className="my-auto space-y-4 max-w-lg">
              {/* Target Word */}
              <div className="flex items-center justify-center gap-3">
                <h2 className="text-5xl font-extrabold text-white tracking-wide">
                  {currentCard.front}
                </h2>
                <AudioPlayer 
                  text={currentCard.front} 
                  lang={currentCard.vocabulary?.language as any || 'zh'} 
                  size="lg" 
                />
              </div>

              {!isFlipped ? (
                <p className="text-xs text-slate-500 animate-pulse mt-4">
                  {dict.flashcards.revealAnswer}
                </p>
              ) : (
                <div className="space-y-4 pt-4 border-t border-slate-800 animate-in fade-in duration-200">
                  {/* Pinyin */}
                  {currentCard.pinyin && (
                    <div className="text-base font-medium">
                      <TonePinyin pinyin={currentCard.pinyin} className="text-base" />
                    </div>
                  )}

                  {/* Vietnamese Meaning */}
                  <div className="text-2xl font-bold text-emerald-300">
                    {currentCard.back}
                  </div>

                  {/* Notes / Part of speech */}
                  {currentCard.vocabulary?.partOfSpeech && (
                    <div className="text-xs text-slate-400 italic">
                      ({currentCard.vocabulary.partOfSpeech})
                    </div>
                  )}

                  {currentCard.note && (
                    <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      {currentCard.note}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Bottom prompt */}
            <div className="w-full flex items-center justify-center text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Nhấn phím Cách (Space) để lật mặt sau</span>
              </span>
            </div>
          </div>

          {/* SM-2 Review Rating Action Buttons */}
          {isFlipped ? (
            <div className="grid grid-cols-4 gap-3 animate-in fade-in duration-150">
              <button
                onClick={() => handleRating(1)}
                className="p-3.5 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 font-bold text-xs flex flex-col items-center gap-1 transition-all group"
              >
                <span className="text-sm">Quên (1)</span>
                <span className="text-[10px] text-rose-400/80 font-normal">Học lại ngày mai</span>
              </button>

              <button
                onClick={() => handleRating(2)}
                className="p-3.5 rounded-2xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-300 font-bold text-xs flex flex-col items-center gap-1 transition-all group"
              >
                <span className="text-sm">Khó (2)</span>
                <span className="text-[10px] text-amber-400/80 font-normal">Ôn sớm</span>
              </button>

              <button
                onClick={() => handleRating(3)}
                className="p-3.5 rounded-2xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/60 text-blue-300 font-bold text-xs flex flex-col items-center gap-1 transition-all group"
              >
                <span className="text-sm">Tốt (3)</span>
                <span className="text-[10px] text-blue-400/80 font-normal">Đúng chuẩn SM-2</span>
              </button>

              <button
                onClick={() => handleRating(4)}
                className="p-3.5 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 font-bold text-xs flex flex-col items-center gap-1 transition-all group"
              >
                <span className="text-sm">Dễ (4)</span>
                <span className="text-[10px] text-emerald-400/80 font-normal">Kéo dài khoảng cách</span>
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={flipCard}
                className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 shadow-xl transition-all"
              >
                {dict.flashcards.revealAnswer}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Finished State */
        <div className="p-12 bg-slate-900/80 border border-slate-800 rounded-3xl text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">{dict.flashcards.noDueCards}</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
            Bạn đã hoàn thành tất cả thẻ cần ôn tập cho hôm nay. Não bộ của bạn đang củng cố trí nhớ dài hạn. Hãy quay lại vào ngày mai!
          </p>
          <div className="pt-2">
            <button
              onClick={fetchDueCards}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              Làm mới danh sách
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
