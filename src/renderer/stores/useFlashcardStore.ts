import { create } from 'zustand';
import { Flashcard, FlashcardRating } from '../../shared/types';

interface FlashcardState {
  dueCards: Flashcard[];
  currentIndex: number;
  isFlipped: boolean;
  isLoading: boolean;
  stats: {
    due: number;
    total: number;
    mastered: number;
    learning: number;
  };
  fetchDueCards: () => Promise<void>;
  flipCard: () => void;
  reviewCurrentCard: (rating: FlashcardRating) => Promise<void>;
}

export const useFlashcardStore = create<FlashcardState>((set, get) => ({
  dueCards: [],
  currentIndex: 0,
  isFlipped: false,
  isLoading: false,
  stats: { due: 0, total: 0, mastered: 0, learning: 0 },

  fetchDueCards: async () => {
    set({ isLoading: true });
    try {
      if (window.electronAPI) {
        const [cards, stats] = await Promise.all([
          window.electronAPI.getDueFlashcards(50),
          window.electronAPI.getFlashcardStats(),
        ]);
        set({
          dueCards: cards || [],
          stats: stats || { due: 0, total: 0, mastered: 0, learning: 0 },
          currentIndex: 0,
          isFlipped: false,
        });
      }
    } catch (err) {
      console.error('Failed to load flashcards:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  flipCard: () => {
    set({ isFlipped: !get().isFlipped });
  },

  reviewCurrentCard: async (rating) => {
    const { dueCards, currentIndex } = get();
    const currentCard = dueCards[currentIndex];
    if (!currentCard) return;

    try {
      if (window.electronAPI) {
        await window.electronAPI.reviewFlashcard(currentCard.id, rating);
      }
      // Advance to next card
      const nextIndex = currentIndex + 1;
      set({
        currentIndex: nextIndex,
        isFlipped: false,
      });

      // If finished all cards, refresh stats
      if (nextIndex >= dueCards.length) {
        await get().fetchDueCards();
      }
    } catch (err) {
      console.error('Failed to review card:', err);
    }
  },
}));
