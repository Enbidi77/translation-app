import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Trash2, 
  Volume2, 
  Filter, 
  Calendar, 
  Sparkles,
  Layers,
  X
} from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useVocabularyStore } from '../stores/useVocabularyStore';
import { useAppStore } from '../stores/useAppStore';
import { VocabularyItem } from '../../shared/types';
import { TonePinyin } from '../components/common/TonePinyin';
import { AudioPlayer } from '../components/common/AudioPlayer';

export const VocabularyPage: React.FC = () => {
  const { dict } = useSettingsStore();
  const { showToast } = useAppStore();
  const { 
    items, 
    isLoading, 
    filterLanguage, 
    searchQuery, 
    fetchVocabulary, 
    saveWord, 
    deleteWord, 
    setFilterLanguage, 
    setSearchQuery 
  } = useVocabularyStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newLanguage, setNewLanguage] = useState<'zh' | 'en'>('zh');
  const [newTranslation, setNewTranslation] = useState('');
  const [newPinyin, setNewPinyin] = useState('');
  const [newPos, setNewPos] = useState('');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    fetchVocabulary();
  }, []);

  const handleAddNewWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newTranslation.trim()) {
      showToast('Vui lòng nhập từ vựng và ý nghĩa!', 'warning');
      return;
    }

    await saveWord({
      word: newWord.trim(),
      language: newLanguage,
      translation: newTranslation.trim(),
      pinyin: newPinyin.trim() || undefined,
      partOfSpeech: newPos.trim() || undefined,
      notes: newNotes.trim() || undefined,
      source: 'manual',
    });

    setIsAddModalOpen(false);
    setNewWord('');
    setNewTranslation('');
    setNewPinyin('');
    setNewPos('');
    setNewNotes('');
    showToast('Đã thêm từ mới vào kho lưu trữ & tạo thẻ Flashcard!', 'success');
  };

  const handleDelete = async (id: number, word: string) => {
    if (confirm(`Bạn có chắc muốn xóa từ "${word}" khỏi sổ từ vựng?`)) {
      await deleteWord(id);
      showToast(`Đã xóa "${word}".`, 'info');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{dict.vocabulary.title}</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Quản lý kho từ vựng đã lưu, theo dõi lịch ôn tập ngắt quãng và cấp độ thành thạo.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-2xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs shadow-google-sm flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{dict.vocabulary.addNewWord}</span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-card p-3.5 rounded-3xl border border-border shadow-google-md">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={dict.vocabulary.searchPlaceholder}
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-google-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 self-start md:self-auto text-xs">
          <button
            onClick={() => setFilterLanguage('all')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              filterLanguage === 'all' 
                ? 'bg-primary text-primary-foreground font-semibold shadow-google-sm' 
                : 'text-foreground-secondary hover:text-foreground hover:bg-surface-hover'
            }`}
          >
            {dict.vocabulary.filterAll} ({items.length})
          </button>
          <button
            onClick={() => setFilterLanguage('zh')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              filterLanguage === 'zh' 
                ? 'bg-destructive-muted text-destructive border border-destructive/30 font-semibold' 
                : 'text-foreground-secondary hover:text-foreground hover:bg-surface-hover'
            }`}
          >
            {dict.vocabulary.filterChinese}
          </button>
          <button
            onClick={() => setFilterLanguage('en')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              filterLanguage === 'en' 
                ? 'bg-primary-muted text-primary border border-primary/30 font-semibold' 
                : 'text-foreground-secondary hover:text-foreground hover:bg-surface-hover'
            }`}
          >
            {dict.vocabulary.filterEnglish}
          </button>
        </div>
      </div>

      {/* Vocabulary Table */}
      <div className="bg-card border border-border rounded-3xl shadow-google-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-hover border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">{dict.vocabulary.wordCol}</th>
                <th className="py-3 px-4">{dict.vocabulary.pinyinCol}</th>
                <th className="py-3 px-4">{dict.vocabulary.meaningCol}</th>
                <th className="py-3 px-4">{dict.vocabulary.posCol}</th>
                <th className="py-3 px-4">{dict.vocabulary.levelCol}</th>
                <th className="py-3 px-4">{dict.vocabulary.nextReviewCol}</th>
                <th className="py-3 px-4 text-right">{dict.vocabulary.actionsCol}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-surface-hover/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-foreground text-sm">
                    <div className="flex items-center gap-2">
                      <span>{item.word}</span>
                      <AudioPlayer text={item.word} lang={item.language as any} size="sm" />
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {item.pinyin ? (
                      <TonePinyin pinyin={item.pinyin} className="text-xs" />
                    ) : item.ipa ? (
                      <span className="font-mono text-muted-foreground">{item.ipa}</span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-success">
                    {item.translation}
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground">
                    {item.partOfSpeech || '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    {item.hskLevel ? (
                      <span className="px-2 py-0.5 rounded-lg bg-destructive-muted text-destructive border border-destructive/30 font-bold">
                        HSK {item.hskLevel}
                      </span>
                    ) : item.cefrLevel ? (
                      <span className="px-2 py-0.5 rounded-lg bg-primary-muted text-primary border border-primary/30 font-bold">
                        CEFR {item.cefrLevel}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{item.nextReviewAt ? new Date(item.nextReviewAt).toLocaleDateString('vi-VN') : 'Hôm nay'}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => item.id && handleDelete(item.id, item.word)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive-muted transition-colors"
                      title="Xóa từ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {items.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              {isLoading ? 'Đang tải từ vựng...' : 'Chưa có từ vựng nào trong danh sách.'}
            </div>
          )}
        </div>
      </div>

      {/* Add New Word Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-google-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <span>Thêm từ vựng mới</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-hover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewWord} className="space-y-3 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">Ngôn ngữ:</label>
                <select
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value as any)}
                  className="w-full bg-surface border border-border rounded-xl p-2.5 text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="zh">Tiếng Trung (简体中文)</option>
                  <option value="en">Tiếng Anh (English)</option>
                </select>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Từ vựng / Cụm từ:</label>
                <input
                  type="text"
                  required
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="Ví dụ: 喜欢 / proficient"
                  className="w-full bg-surface border border-border rounded-xl p-2.5 text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Phiên âm (Pinyin / IPA):</label>
                <input
                  type="text"
                  value={newPinyin}
                  onChange={(e) => setNewPinyin(e.target.value)}
                  placeholder="Ví dụ: xǐhuan"
                  className="w-full bg-surface border border-border rounded-xl p-2.5 text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Ý nghĩa tiếng Việt:</label>
                <input
                  type="text"
                  required
                  value={newTranslation}
                  onChange={(e) => setNewTranslation(e.target.value)}
                  placeholder="Ví dụ: thích, mến mộ"
                  className="w-full bg-surface border border-border rounded-xl p-2.5 text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Từ loại (Part of speech):</label>
                <input
                  type="text"
                  value={newPos}
                  onChange={(e) => setNewPos(e.target.value)}
                  placeholder="Ví dụ: Động từ (动词)"
                  className="w-full bg-surface border border-border rounded-xl p-2.5 text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Ghi chú ngữ cảnh:</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ghi chú ngữ cảnh sử dụng..."
                  className="w-full bg-surface border border-border rounded-xl p-2.5 text-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-hover text-foreground-secondary hover:text-foreground"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold shadow-google-sm"
                >
                  Lưu từ vựng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
