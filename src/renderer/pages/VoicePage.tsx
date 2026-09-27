import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Sparkles, 
  Languages, 
  RefreshCw,
  BookmarkPlus
} from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useAppStore } from '../stores/useAppStore';
import { useVocabularyStore } from '../stores/useVocabularyStore';
import { SupportedLanguage } from '../../shared/types';
import { TonePinyin } from '../components/common/TonePinyin';
import { AudioPlayer } from '../components/common/AudioPlayer';

export const VoicePage: React.FC = () => {
  const { dict } = useSettingsStore();
  const { showToast } = useAppStore();
  const { saveWord } = useVocabularyStore();

  const [isListening, setIsListening] = useState(false);
  const [sourceLang, setSourceLang] = useState<'zh-CN' | 'en-US' | 'vi-VN'>('zh-CN');
  const [targetLang, setTargetLang] = useState<SupportedLanguage>('vi');
  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');
  const [pinyin, setPinyin] = useState('');

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = sourceLang;

      recognition.onresult = async (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }

        if (currentTranscript.trim()) {
          setTranscript(currentTranscript);

          // Translate streaming / partial transcript
          if (window.electronAPI) {
            try {
              const res = await window.electronAPI.translate({
                text: currentTranscript,
                sourceLang: sourceLang === 'zh-CN' ? 'zh' : sourceLang === 'en-US' ? 'en' : 'vi',
                targetLang,
                mode: 'natural',
              });

              setTranslation(res.translatedText);
              if (res.pinyin) setPinyin(res.pinyin);

              // Send to floating subtitle overlay if active
              window.electronAPI.sendSubtitleEntry({
                original: currentTranscript,
                pinyin: res.pinyin,
                translation: res.translatedText,
              });
            } catch (err) {
              console.warn('Realtime translation error:', err);
            }
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          showToast(`Lỗi micro: ${event.error}`, 'error');
        }
      };

      recognition.onend = () => {
        if (isListening) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [sourceLang, targetLang, isListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      showToast('Trình duyệt / môi trường không hỗ trợ Speech Recognition.', 'warning');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      showToast('Đã dừng ghi âm.', 'info');
    } else {
      setTranscript('');
      setTranslation('');
      setPinyin('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
        showToast('Đang lắng nghe giọng nói...', 'success');
      } catch (e: any) {
        showToast(`Không thể khởi động micro: ${e.message}`, 'error');
      }
    }
  };

  const handleSaveToVocab = async () => {
    if (!transcript || !translation) return;
    await saveWord({
      word: transcript,
      language: sourceLang === 'zh-CN' ? 'zh' : 'en',
      translation,
      pinyin,
      source: 'voice_translator',
    });
    showToast('Đã lưu câu vừa nói vào từ vựng!', 'success');
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{dict.voice.title}</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Nhận diện giọng nói liên tục và hiển thị bản dịch ngay lập tức cho các cuộc họp, video hoặc trò chuyện.
          </p>
        </div>

        {/* Language Selection */}
        <div className="flex items-center gap-2 text-xs">
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value as any)}
            className="bg-surface border border-border text-foreground rounded-xl px-3 py-1.5 focus:outline-none focus:border-primary"
          >
            <option value="zh-CN">Nói tiếng Trung (zh-CN)</option>
            <option value="en-US">Nói tiếng Anh (en-US)</option>
            <option value="vi-VN">Nói tiếng Việt (vi-VN)</option>
          </select>

          <span className="text-muted-foreground font-bold">→</span>

          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value as any)}
            className="bg-surface border border-border text-foreground rounded-xl px-3 py-1.5 focus:outline-none focus:border-primary"
          >
            <option value="vi">Dịch sang Tiếng Việt</option>
            <option value="zh">Dịch sang Tiếng Trung</option>
            <option value="en">Dịch sang Tiếng Anh</option>
          </select>
        </div>
      </div>

      {/* Main Microphone Action Card */}
      <div className="p-8 bg-card border border-border rounded-3xl flex flex-col items-center justify-center space-y-5 shadow-google-md relative overflow-hidden">
        {/* Pulsing ring animation when listening */}
        {isListening && (
          <div className="absolute w-48 h-48 rounded-full bg-primary-muted animate-ping pointer-events-none" />
        )}

        <button
          onClick={toggleListening}
          className={`w-24 h-24 rounded-full flex items-center justify-center shadow-google-lg transition-all z-10 ${
            isListening
              ? 'bg-destructive hover:opacity-90 text-destructive-foreground animate-pulse'
              : 'bg-primary hover:bg-primary-hover text-primary-foreground'
          }`}
        >
          {isListening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
        </button>

        <div className="text-center z-10">
          <h3 className="text-base font-bold text-foreground">
            {isListening ? dict.voice.listeningStatus : dict.voice.startListening}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {isListening ? 'Đang phân tích âm thanh trực tiếp qua Web Speech API...' : dict.voice.speakNow}
          </p>
        </div>
      </div>

      {/* Real-Time Transcript & Translation Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Spoken Text */}
        <div className="p-5 bg-card border border-border rounded-3xl space-y-3 shadow-google-sm">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Nội dung vừa nói:
            </span>
            {transcript && (
              <AudioPlayer text={transcript} lang={sourceLang.startsWith('zh') ? 'zh' : 'en'} size="sm" />
            )}
          </div>

          <div className="min-h-[100px] text-lg font-medium text-foreground leading-relaxed">
            {transcript || <span className="text-muted-foreground/60 italic">Văn bản nhận diện sẽ hiển thị tại đây...</span>}
          </div>

          {pinyin && (
            <div className="p-2.5 bg-surface-hover rounded-xl border border-border">
              <TonePinyin pinyin={pinyin} className="text-xs font-medium" />
            </div>
          )}
        </div>

        {/* Target Translation */}
        <div className="p-5 bg-card border border-border rounded-3xl space-y-3 shadow-google-sm">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="text-xs font-semibold text-success uppercase tracking-wider">
              {dict.voice.realtimeTranscript}:
            </span>
            {translation && (
              <div className="flex items-center gap-1.5">
                <AudioPlayer text={translation} lang={targetLang as any} size="sm" />
                <button
                  onClick={handleSaveToVocab}
                  className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
                  title="Lưu câu vào sổ từ vựng"
                >
                  <BookmarkPlus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="min-h-[100px] text-lg font-medium text-success leading-relaxed">
            {translation || <span className="text-muted-foreground/60 italic">Bản dịch thời gian thực sẽ xuất hiện tại đây...</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
