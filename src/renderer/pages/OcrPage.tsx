import React, { useState, useRef } from 'react';
import { 
  ScanText, 
  UploadCloud, 
  Crop, 
  ClipboardPaste, 
  Sparkles, 
  Volume2, 
  BookmarkPlus,
  Loader2
} from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useAppStore } from '../stores/useAppStore';
import { useVocabularyStore } from '../stores/useVocabularyStore';
import { OCRResult, TranslationResponse } from '../../shared/types';
import { TonePinyin } from '../components/common/TonePinyin';
import { AudioPlayer } from '../components/common/AudioPlayer';

export const OcrPage: React.FC = () => {
  const { dict } = useSettingsStore();
  const { openWordModal, showToast } = useAppStore();
  const { saveWord } = useVocabularyStore();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [translation, setTranslation] = useState<TranslationResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImageBuffer = async (dataUrl: string) => {
    setImagePreview(dataUrl);
    setIsProcessing(true);
    try {
      if (window.electronAPI) {
        // 1. Run OCR
        const ocr = await window.electronAPI.processOcrImage(dataUrl);
        setOcrResult(ocr);

        if (ocr.text && ocr.text.trim()) {
          // 2. Translate text
          const trans = await window.electronAPI.translate({
            text: ocr.text,
            sourceLang: ocr.detectedLang || 'auto',
            targetLang: 'vi',
            mode: 'learning',
          });
          setTranslation(trans);
        } else {
          showToast('Không phát hiện thấy văn bản trong hình ảnh.', 'warning');
        }
      }
    } catch (err: any) {
      showToast(`Lỗi OCR: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      processImageBuffer(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image')) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const dataUrl = evt.target?.result as string;
            processImageBuffer(dataUrl);
          };
          reader.readAsDataURL(blob);
          showToast('Đã dán ảnh từ bộ nhớ tạm!', 'info');
          break;
        }
      }
    }
  };

  const handleTriggerSnip = () => {
    window.electronAPI?.triggerSnip();
  };

  return (
    <div
      onPaste={handlePaste}
      tabIndex={0}
      className="p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto focus:outline-none"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{dict.ocr.title}</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Nhận diện văn bản từ ảnh chụp màn hình, game, tài liệu PDF, truyện tranh hoặc ảnh dán trực tiếp.
          </p>
        </div>

        <button
          onClick={handleTriggerSnip}
          className="px-4 py-2 rounded-xl bg-primary hover:bg-blue-600 text-white font-medium text-xs shadow-lg shadow-primary/20 flex items-center gap-2 transition-all"
        >
          <Crop className="w-4 h-4" />
          <span>{dict.ocr.snipScreen}</span>
        </button>
      </div>

      {/* Upload & Dropzone Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-700/80 hover:border-primary/60 bg-slate-900/50 hover:bg-slate-900/80 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-slate-200">{dict.ocr.dragDrop}</p>
        <p className="text-xs text-slate-500 mt-1">
          Hỗ trợ định dạng PNG, JPG, WebM hoặc nhấn <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-400 font-mono">Ctrl + V</kbd> để dán ảnh
        </p>
      </div>

      {/* OCR & Processing State */}
      {isProcessing && (
        <div className="p-8 bg-slate-900/70 border border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm font-medium text-slate-300">{dict.ocr.recognizing}</p>
        </div>
      )}

      {/* OCR Results Display */}
      {ocrResult && !isProcessing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Image preview & lines */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {dict.ocr.recognizedText}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-700/50">
                Độ chính xác: {ocrResult.confidence}%
              </span>
            </div>

            {imagePreview && (
              <div className="rounded-xl overflow-hidden border border-slate-800 max-h-48 flex items-center justify-center bg-black/40">
                <img src={imagePreview} alt="OCR Target" className="max-h-48 object-contain" />
              </div>
            )}

            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
              <div className="text-base font-medium text-white leading-relaxed whitespace-pre-wrap">
                {ocrResult.text}
              </div>
              {ocrResult.lines && ocrResult.lines.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                  Tổng số dòng: {ocrResult.lines.length}
                </div>
              )}
            </div>
          </div>

          {/* Right: Translation & Learning breakdown */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Bản dịch Tiếng Việt
              </span>
              {translation && (
                <div className="flex items-center gap-1">
                  <AudioPlayer text={translation.sourceText} lang="zh" size="sm" />
                  <AudioPlayer text={translation.sourceText} lang="zh" slow size="sm" />
                </div>
              )}
            </div>

            {translation ? (
              <div className="space-y-4">
                <p className="text-lg font-bold text-emerald-300 leading-snug">
                  {translation.translatedText}
                </p>

                {translation.pinyin && (
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                      Pinyin:
                    </span>
                    <TonePinyin pinyin={translation.pinyin} className="text-xs font-medium" />
                  </div>
                )}

                {/* Vocabulary Chips */}
                {translation.words && translation.words.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Từ vựng bóc tách (bấm để xem & lưu):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {translation.words.map((w, i) => (
                        <button
                          key={i}
                          onClick={() => openWordModal(w)}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700/80 hover:border-primary text-xs font-medium text-slate-200 transition-colors"
                        >
                          {w.word}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500">Chưa có bản dịch.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
