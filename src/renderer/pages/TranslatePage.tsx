import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  Sparkles, 
  Copy, 
  Check, 
  BookmarkPlus, 
  AlertCircle, 
  BookOpen, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useAppStore } from '../stores/useAppStore';
import { useVocabularyStore } from '../stores/useVocabularyStore';
import { TranslationResponse, SupportedLanguage, TranslationQualityMode } from '../../shared/types';
import { TonePinyin } from '../components/common/TonePinyin';
import { AudioPlayer } from '../components/common/AudioPlayer';

export const TranslatePage: React.FC = () => {
  const { dict } = useSettingsStore();
  const { openWordModal, showToast } = useAppStore();
  const { saveWord } = useVocabularyStore();

  const [inputText, setInputText] = useState('这个角色非常适合新手使用。');
  const [sourceLang, setSourceLang] = useState<SupportedLanguage | 'auto'>('auto');
  const [targetLang, setTargetLang] = useState<SupportedLanguage>('vi');
  const [mode, setMode] = useState<TranslationQualityMode>('learning');
  const [result, setResult] = useState<TranslationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(true);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    try {
      if (window.electronAPI) {
        const res = await window.electronAPI.translate({
          text: inputText.trim(),
          sourceLang,
          targetLang,
          mode,
        });
        setResult(res);
      }
    } catch (err: any) {
      showToast(`Lỗi dịch: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.translatedText) return;
    navigator.clipboard.writeText(result.translatedText);
    setCopied(true);
    showToast(dict.translate.copySuccess, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveWholeSentence = async () => {
    if (!result) return;
    await saveWord({
      word: result.sourceText,
      language: result.sourceLang,
      translation: result.translatedText,
      pinyin: result.pinyin,
      source: 'manual_translate',
    });
    showToast('Đã lưu câu vào sổ từ vựng!', 'success');
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{dict.translate.title}</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Dịch song ngữ Tiếng Trung ↔ Tiếng Việt, Tiếng Anh ↔ Tiếng Việt kết hợp phân tích ngữ pháp chuyên sâu.
          </p>
        </div>

        {/* Translation Quality Mode Switcher */}
        <div className="flex items-center gap-1 bg-surface border border-border p-1 rounded-2xl text-xs shadow-google-sm">
          <button
            onClick={() => setMode('learning')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              mode === 'learning' ? 'bg-primary text-primary-foreground shadow-google-sm font-semibold' : 'text-foreground-secondary hover:text-foreground hover:bg-surface-hover'
            }`}
          >
            {dict.translate.modeLearning}
          </button>
          <button
            onClick={() => setMode('natural')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              mode === 'natural' ? 'bg-primary text-primary-foreground shadow-google-sm font-semibold' : 'text-foreground-secondary hover:text-foreground hover:bg-surface-hover'
            }`}
          >
            {dict.translate.modeNatural}
          </button>
          <button
            onClick={() => setMode('literal')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              mode === 'literal' ? 'bg-primary text-primary-foreground shadow-google-sm font-semibold' : 'text-foreground-secondary hover:text-foreground hover:bg-surface-hover'
            }`}
          >
            {dict.translate.modeLiteral}
          </button>
        </div>
      </div>

      {/* Language Bar & Input Area */}
      <div className="bg-card border border-border rounded-3xl p-5 space-y-4 shadow-google-md">
        <div className="flex items-center justify-between pb-3 border-b border-border text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{dict.translate.sourceLang}:</span>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value as any)}
              className="bg-surface-hover border border-border text-foreground rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-primary"
            >
              <option value="auto">Tự động nhận diện</option>
              <option value="zh">Tiếng Trung (简体中文)</option>
              <option value="en">Tiếng Anh (English)</option>
              <option value="vi">Tiếng Việt</option>
            </select>
          </div>

          <button
            onClick={() => {
              if (sourceLang !== 'auto') {
                const temp = sourceLang;
                setSourceLang(targetLang);
                setTargetLang(temp as SupportedLanguage);
              }
            }}
            className="p-1.5 rounded-xl hover:bg-surface-hover text-muted-foreground hover:text-primary transition-colors border border-border"
            title="Đảo chiều dịch"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{dict.translate.targetLang}:</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value as any)}
              className="bg-surface-hover border border-border text-foreground rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-primary"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="zh">Tiếng Trung (简体中文)</option>
              <option value="en">Tiếng Anh (English)</option>
            </select>
          </div>
        </div>

        {/* Input box */}
        <div className="relative space-y-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleTranslate();
              }
            }}
            rows={3}
            placeholder={dict.translate.placeholder}
            className="w-full bg-surface border border-border rounded-2xl p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-base resize-none shadow-google-sm"
          />

          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-muted-foreground">Mẹo: Nhấn <kbd className="px-1.5 py-0.5 bg-surface-hover rounded font-mono border border-border text-foreground">Ctrl + Enter</kbd> để dịch ngay</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setInputText('')}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-xl hover:bg-surface-hover transition-colors"
              >
                {dict.translate.clearBtn}
              </button>
              <button
                onClick={handleTranslate}
                disabled={isLoading || !inputText.trim()}
                className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs shadow-google-sm flex items-center gap-2 disabled:opacity-50 transition-all"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{dict.translate.translateBtn}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Translation Output Result */}
      {result && (
        <div className="bg-card border border-border rounded-3xl p-6 space-y-5 shadow-google-md">
          {/* Main translation banner */}
          <div className="space-y-3 pb-4 border-b border-border">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Bản dịch ({result.targetLang.toUpperCase()}):
                </span>
                <p className="text-xl md:text-2xl font-bold text-foreground mt-1 leading-snug">
                  {result.translatedText}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <AudioPlayer text={result.translatedText} lang={result.targetLang as any} size="md" />
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors border border-border"
                  title="Sao chép"
                >
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleSaveWholeSentence}
                  className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-surface-hover transition-colors border border-border"
                  title="Lưu câu vào sổ từ vựng"
                >
                  <BookmarkPlus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Pinyin representation for Chinese text */}
            {result.pinyin && (
              <div className="p-3 bg-surface-hover rounded-2xl border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Phiên âm Pinyin (có thanh điệu):
                  </span>
                  <div className="flex items-center gap-1">
                    <AudioPlayer text={result.sourceText} lang="zh" size="sm" />
                    <AudioPlayer text={result.sourceText} lang="zh" slow size="sm" />
                  </div>
                </div>
                <TonePinyin pinyin={result.pinyin} className="text-sm font-medium" />
              </div>
            )}
          </div>

          {/* Interactive Word-by-Word Breakdown */}
          {result.words && result.words.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span>{dict.translate.breakdownTitle} (Bấm vào từ để xem chi tiết & lưu flashcard):</span>
              </span>

              <div className="flex flex-wrap gap-2 pt-1">
                {result.words.map((token, idx) => (
                  <div
                    key={idx}
                    onClick={() => openWordModal(token)}
                    className="p-3 rounded-2xl bg-surface border border-border hover:border-primary/50 hover:bg-surface-hover cursor-pointer transition-all flex flex-col items-center min-w-[75px] shadow-google-sm"
                  >
                    <span className="text-base font-bold text-foreground">{token.word}</span>
                    {token.pinyin && <span className="text-[11px] text-primary font-mono">{token.pinyin}</span>}
                    <span className="text-[11px] text-muted-foreground mt-0.5 text-center truncate max-w-[120px]">
                      {token.translation}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI In-Depth Sentence Analysis Section */}
          {result.analysis && (
            <div className="pt-4 border-t border-border space-y-4">
              <div 
                onClick={() => setShowAnalysis(!showAnalysis)}
                className="flex items-center justify-between cursor-pointer py-1 text-foreground-secondary hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-warning" />
                  <span className="font-semibold text-sm">Phân tích cú pháp & Lỗi thường gặp cho người Việt</span>
                </div>
                {showAnalysis ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>

              {showAnalysis && (
                <div className="space-y-4 text-xs animate-in fade-in duration-200">
                  {/* Grammatical Structure Chips */}
                  {result.analysis.structure && (
                    <div className="p-4 bg-surface rounded-2xl border border-border space-y-2 shadow-google-sm">
                      <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                        Cấu trúc ngữ pháp câu (Sentence Structure):
                      </span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        {result.analysis.structure.subject && (
                          <div className="p-2.5 rounded-xl bg-surface-hover border border-border">
                            <span className="text-muted-foreground block text-[10px]">Chủ ngữ (Subject):</span>
                            <span className="font-semibold text-foreground">{result.analysis.structure.subject}</span>
                          </div>
                        )}
                        {result.analysis.structure.adverbial && (
                          <div className="p-2.5 rounded-xl bg-surface-hover border border-border">
                            <span className="text-muted-foreground block text-[10px]">Phó từ/Trạng ngữ:</span>
                            <span className="font-semibold text-warning">{result.analysis.structure.adverbial}</span>
                          </div>
                        )}
                        {result.analysis.structure.predicate && (
                          <div className="p-2.5 rounded-xl bg-surface-hover border border-border">
                            <span className="text-muted-foreground block text-[10px]">Vị ngữ (Verb):</span>
                            <span className="font-semibold text-success">{result.analysis.structure.predicate}</span>
                          </div>
                        )}
                        {result.analysis.structure.object && (
                          <div className="p-2.5 rounded-xl bg-surface-hover border border-border">
                            <span className="text-muted-foreground block text-[10px]">Tân ngữ (Object):</span>
                            <span className="font-semibold text-primary">{result.analysis.structure.object}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Vietnamese Transfer Error Detection & Tip */}
                  {result.analysis.vietnameseLearnerTips && (
                    <div className="p-4 bg-warning-muted border border-warning/30 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-warning font-semibold text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{dict.translate.vietnameseTipTitle}:</span>
                        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-surface text-warning border border-warning/30 font-medium">
                          {result.analysis.vietnameseLearnerTips.naturalnessScore || 'Mức độ tự nhiên: Tốt'}
                        </span>
                      </div>
                      <p className="text-foreground leading-relaxed">
                        {result.analysis.vietnameseLearnerTips.explanation || result.analysis.vietnameseLearnerTips.commonMistake}
                      </p>
                      {result.analysis.vietnameseLearnerTips.naturalAlternative && (
                        <div className="pt-2 border-t border-warning/20 flex items-center gap-2">
                          <span className="text-muted-foreground">Cách nói bản xứ khuyên dùng:</span>
                          <span className="font-semibold text-foreground">{result.analysis.vietnameseLearnerTips.naturalAlternative}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Grammar Points */}
                  {result.analysis.grammarPoints && result.analysis.grammarPoints.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                        {dict.translate.grammarTitle}:
                      </span>
                      {result.analysis.grammarPoints.map((gp, i) => (
                        <div key={i} className="p-4 bg-surface rounded-2xl border border-border space-y-1 shadow-google-sm">
                          <div className="font-bold text-foreground">{gp.title}</div>
                          <p className="text-foreground-secondary leading-relaxed">{gp.explanation}</p>
                          {gp.examples && gp.examples.length > 0 && (
                            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground pl-1 pt-1">
                              {gp.examples.map((ex, j) => (
                                <li key={j} className="text-foreground-secondary">{ex}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
