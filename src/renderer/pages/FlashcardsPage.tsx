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
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{dict.flashcards.title}</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Thuật toán SuperMemo SM-2 tối ưu hóa khoảng thời gian ôn tập để ghi nhớ lâu dài.
          </p>
        </div>

        {/* Stats Pill */}
        <div className="flex items-center gap-2 bg-card border border-border px-3.5 py-1.5 rounded-2xl text-xs shadow-google-sm">
          <Layers className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">Cần ôn tập:</span>
          <span className="font-bold text-warning">{dueCards.length - currentIndex} thẻ</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-surface-hover border border-border h-2.5 rounded-full overflow-hidden">
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
            className={`min-h-[340px] rounded-3xl p-8 flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-300 border shadow-google-md relative select-none ${
              isFlipped
                ? 'bg-card border-primary/50 shadow-google-lg'
                : 'bg-card border-border hover:border-primary/40 hover:bg-card-hover'
            }`}
          >
            {/* Header info */}
            <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-mono">Thẻ {currentIndex + 1} / {dueCards.length}</span>
              <div className="flex items-center gap-1.5">
                <span className="capitalize px-2 py-0.5 rounded-full bg-surface-hover text-muted-foreground text-[10px] font-semibold border border-border">
                  {currentCard.state}
                </span>
                {currentCard.vocabulary?.hskLevel && (
                  <span className="px-2 py-0.5 rounded-full bg-destructive-muted text-destructive border border-destructive/30 text-[10px] font-bold">
                    HSK {currentCard.vocabulary.hskLevel}
                  </span>
                )}
              </div>
            </div>

            {/* Front & Back Content */}
            <div className="my-auto space-y-4 max-w-lg">
              {/* Target Word */}
              <div className="flex items-center justify-center gap-3">
                <h2 className="text-5xl font-extrabold text-foreground tracking-wide font-sans">
                  {currentCard.front}
                </h2>
                <AudioPlayer 
                  text={currentCard.front} 
                  lang={currentCard.vocabulary?.language as any || 'zh'} 
                  size="lg" 
                />
              </div>

              {!isFlipped ? (
                <p className="text-xs text-muted-foreground animate-pulse mt-4">
                  {dict.flashcards.revealAnswer}
                </p>
              ) : (
                <div className="space-y-4 pt-4 border-t border-border animate-in fade-in duration-200">
                  {/* Pinyin */}
                  {currentCard.pinyin && (
                    <div className="text-base font-medium">
                      <TonePinyin pinyin={currentCard.pinyin} className="text-base" />
                    </div>
                  )}

                  {/* Vietnamese Meaning */}
                  <div className="text-2xl font-bold text-success">
                    {currentCard.back}
                  </div>

                  {/* Notes / Part of speech */}
                  {currentCard.vocabulary?.partOfSpeech && (
                    <div className="text-xs text-muted-foreground italic">
                      ({currentCard.vocabulary.partOfSpeech})
                    </div>
                  )}

                  {currentCard.note && (
                    <p className="text-xs text-foreground-secondary bg-surface-hover p-3 rounded-2xl border border-border">
                      {currentCard.note}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Bottom prompt */}
            <div className="w-full flex items-center justify-center text-xs text-muted-foreground">
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
                className="p-3.5 rounded-2xl bg-destructive-muted hover:bg-destructive/20 border border-destructive/40 text-destructive font-bold text-xs flex flex-col items-center gap-1 transition-all shadow-google-sm"
              >
                <span className="text-sm">Quên (1)</span>
                <span className="text-[10px] opacity-80 font-normal">Học lại ngày mai</span>
              </button>

              <button
                onClick={() => handleRating(2)}
                className="p-3.5 rounded-2xl bg-warning-muted hover:bg-warning/20 border border-warning/40 text-warning font-bold text-xs flex flex-col items-center gap-1 transition-all shadow-google-sm"
              >
                <span className="text-sm">Khó (2)</span>
                <span className="text-[10px] opacity-80 font-normal">Ôn sớm</span>
              </button>

              <button
                onClick={() => handleRating(3)}
                className="p-3.5 rounded-2xl bg-primary-muted hover:bg-primary/20 border border-primary/40 text-primary font-bold text-xs flex flex-col items-center gap-1 transition-all shadow-google-sm"
              >
                <span className="text-sm">Tốt (3)</span>
                <span className="text-[10px] opacity-80 font-normal">Đúng chuẩn SM-2</span>
              </button>

              <button
                onClick={() => handleRating(4)}
                className="p-3.5 rounded-2xl bg-success-muted hover:bg-success/20 border border-success/40 text-success font-bold text-xs flex flex-col items-center gap-1 transition-all shadow-google-sm"
              >
                <span className="text-sm">Dễ (4)</span>
                <span className="text-[10px] opacity-80 font-normal">Kéo dài khoảng cách</span>
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={flipCard}
                className="px-6 py-3 rounded-2xl bg-surface hover:bg-surface-hover text-foreground font-semibold text-xs border border-border shadow-google-md transition-all"
              >
                {dict.flashcards.revealAnswer}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Finished State */
        <div className="p-12 bg-card border border-border rounded-3xl text-center space-y-4 shadow-google-md">
          <div className="w-16 h-16 rounded-full bg-success-muted border border-success/30 text-success flex items-center justify-center mx-auto shadow-google-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-foreground">{dict.flashcards.noDueCards}</h3>
          <p className="text-muted-foreground text-xs max-w-md mx-auto leading-relaxed">
            Bạn đã hoàn thành tất cả thẻ cần ôn tập cho hôm nay. Não bộ của bạn đang củng cố trí nhớ dài hạn. Hãy quay lại vào ngày mai!
          </p>
          <div className="pt-2">
            <button
              onClick={fetchDueCards}
              className="px-4 py-2 rounded-2xl bg-surface hover:bg-surface-hover text-foreground text-xs font-semibold border border-border shadow-google-sm transition-colors"
            >
              Làm mới danh sách
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
