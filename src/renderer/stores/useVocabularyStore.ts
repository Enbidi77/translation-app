import { create } from 'zustand';
import { VocabularyItem } from '../../shared/types';

interface VocabularyState {
  items: VocabularyItem[];
  isLoading: boolean;
  filterLanguage: string;
  searchQuery: string;
  fetchVocabulary: (lang?: string) => Promise<void>;
  saveWord: (item: VocabularyItem) => Promise<VocabularyItem | null>;
  deleteWord: (id: number) => Promise<void>;
  setFilterLanguage: (lang: string) => void;
  setSearchQuery: (query: string) => void;
}

export const useVocabularyStore = create<VocabularyState>((set, get) => ({
  items: [],
  isLoading: false,
  filterLanguage: 'all',
  searchQuery: '',

  fetchVocabulary: async (lang) => {
    set({ isLoading: true });
    try {
      if (window.electronAPI) {
        const query = get().searchQuery.trim();
        let results: VocabularyItem[];
        if (query) {
          results = await window.electronAPI.searchVocabulary(query);
        } else {
          results = await window.electronAPI.getVocabulary(lang === 'all' ? undefined : lang);
        }
        set({ items: results });
      }
    } catch (err) {
      console.error('Failed to load vocabulary:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  saveWord: async (item) => {
    try {
      if (window.electronAPI) {
        const saved = await window.electronAPI.saveVocabulary(item);
        await get().fetchVocabulary(get().filterLanguage);
        return saved;
      }
      return null;
    } catch (err) {
      console.error('Failed to save word:', err);
      return null;
    }
  },

  deleteWord: async (id) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.deleteVocabulary(id);
        await get().fetchVocabulary(get().filterLanguage);
      }
    } catch (err) {
      console.error('Failed to delete word:', err);
    }
  },

  setFilterLanguage: (lang) => {
    set({ filterLanguage: lang });
    get().fetchVocabulary(lang);
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().fetchVocabulary(get().filterLanguage);
  },
}));
