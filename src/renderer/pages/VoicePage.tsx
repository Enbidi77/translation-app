import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Sparkles, 
  Languages, 
  RefreshCw,
  BookmarkPlus,
  Loader2,
  AlertCircle,
  Settings,
  ArrowRight,
  PlayCircle,
  ArrowRightLeft,
  Subtitles,
  Copy,
  Check,
  CheckCircle2,
  Radio,
  Clock,
  Key
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useAppStore } from '../stores/useAppStore';
import { useVocabularyStore } from '../stores/useVocabularyStore';
import { SupportedLanguage } from '../../shared/types';
import { POPULAR_LANGUAGES } from '../../shared/constants/languages';
import { TonePinyin } from '../components/common/TonePinyin';
import { AudioPlayer } from '../components/common/AudioPlayer';
import { soundManager } from '../services/audioService';

interface VoiceSessionItem {
  id: string;
  time: string;
  sourceLang: string;
  targetLang: string;
  transcript: string;
  pinyin?: string;
  translation: string;
}

export const VoicePage: React.FC = () => {
  const navigate = useNavigate();
  const { dict, settings, updateSettings } = useSettingsStore();
  const { showToast } = useAppStore();
  const { saveWord } = useVocabularyStore();

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [autoStopSilence, setAutoStopSilence] = useState(true);
  const [continuousMode, setContinuousMode] = useState(false);

  const [sourceLang, setSourceLang] = useState<string>('zh-CN');
  const [targetLang, setTargetLang] = useState<SupportedLanguage>('vi');
  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Quick API Key setup state
  const [quickKeyInput, setQuickKeyInput] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);

  // Session conversation history
  const [sessionHistory, setSessionHistory] = useState<VoiceSessionItem[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // VAD refs
  const hasSpokenRef = useRef(false);
  const silenceStartRef = useRef<number | null>(null);
  const isListeningRef = useRef(false);
  const continuousModeRef = useRef(continuousMode);
  continuousModeRef.current = continuousMode;

  const autoStopSilenceRef = useRef(autoStopSilence);
  autoStopSilenceRef.current = autoStopSilence;

  const sourceLangRef = useRef(sourceLang);
  sourceLangRef.current = sourceLang;

  const targetLangRef = useRef(targetLang);
  targetLangRef.current = targetLang;

  // Check if API key is configured
  const hasApiKey = Boolean(
    settings.providers?.geminiApiKey?.trim() || 
    settings.providers?.openaiApiKey?.trim()
  );

  useEffect(() => {
    return () => {
      stopMicrophone();
    };
  }, []);

  const stopMicrophone = () => {
    isListeningRef.current = false;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (_) {}
      audioContextRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
      mediaRecorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsListening(false);
    setAudioLevel(0);
    setRecordingSeconds(0);
    hasSpokenRef.current = false;
    silenceStartRef.current = null;
  };

  const handleStopAndProcess = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const startMicrophone = async () => {
    setErrorBanner(null);
    hasSpokenRef.current = false;
    silenceStartRef.current = null;
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Timer counter
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((sec) => {
          // Max duration 15s safety cutoff
          if (sec >= 14) {
            handleStopAndProcess();
            return 15;
          }
          return sec + 1;
        });
      }, 1000);

      // Audio level analyser for visual feedback & VAD
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkLevel = () => {
          if (audioContextRef.current && streamRef.current && isListeningRef.current) {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const currentLevel = Math.min(100, Math.round(avg * 1.6));
            setAudioLevel(currentLevel);

            // Voice Activity Detection (VAD)
            if (autoStopSilenceRef.current) {
              if (currentLevel > 16) {
                // User is talking
                hasSpokenRef.current = true;
                silenceStartRef.current = null;
              } else if (hasSpokenRef.current) {
                // User has spoken, now level dropped
                if (!silenceStartRef.current) {
                  silenceStartRef.current = Date.now();
                } else if (Date.now() - silenceStartRef.current > 1400) {
                  // Silence for >1.4s after speaking: auto-stop and process!
                  handleStopAndProcess();
                  return;
                }
              }
            }

            animFrameRef.current = requestAnimationFrame(checkLevel);
          }
        };
        animFrameRef.current = requestAnimationFrame(checkLevel);
      }

      // MediaRecorder configuration
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];

        // Clean up current recording stream
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          try { audioContextRef.current.close(); } catch (_) {}
          audioContextRef.current = null;
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        setIsListening(false);
        setAudioLevel(0);
        isListeningRef.current = false;

        if (blob.size > 1200) {
          await processRecordedAudio(blob, mimeType);
        } else if (hasSpokenRef.current) {
          showToast('Âm thanh quá ngắn hoặc micro chưa thu rõ.', 'info');
        }

        // If continuous mode is enabled, auto restart listening
        if (continuousModeRef.current) {
          setTimeout(() => {
            if (continuousModeRef.current) {
              startMicrophone();
            }
          }, 600);
        }
      };

      // Start recording
      isListeningRef.current = true;
      mediaRecorder.start();
      setIsListening(true);
      showToast('Đang lắng nghe qua micro... Hãy nói một câu!', 'info');
    } catch (err: any) {
      console.error('Failed to access microphone:', err);
      setIsListening(false);
      isListeningRef.current = false;
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        showToast('Quyền truy cập micro đã bị từ chối.', 'error');
        setErrorBanner('Quyền truy cập micro bị từ chối. Vui lòng cấp quyền micro trong cài đặt Windows.');
      } else {
        showToast(`Không thể mở micro: ${err.message}`, 'error');
        setErrorBanner(`Không thể mở micro: ${err.message}`);
      }
    }
  };

  const processRecordedAudio = async (blob: Blob, mimeType: string) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        if (!window.electronAPI) {
          setIsProcessing(false);
          return;
        }

        const curSrc = sourceLangRef.current;
        const curTgt = targetLangRef.current;

        const res = await window.electronAPI.transcribeAudio({
          audioData: base64Data,
          mimeType,
          sourceLang: curSrc,
          targetLang: curTgt,
        });

        setIsProcessing(false);

        if (res.success && res.transcript) {
          setTranscript(res.transcript);
          setTranslation(res.translation || '');
          setPinyin(res.pinyin || '');

          // Broadcast to floating subtitle overlay
          window.electronAPI.sendSubtitleEntry({
            original: res.transcript,
            pinyin: res.pinyin,
            translation: res.translation || '',
          }, true);

          // Add to session history
          const newItem: VoiceSessionItem = {
            id: Date.now().toString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            sourceLang: curSrc,
            targetLang: curTgt,
            transcript: res.transcript,
            pinyin: res.pinyin,
            translation: res.translation || '',
          };
          setSessionHistory((prev) => [newItem, ...prev.slice(0, 19)]);

          showToast('Nhận diện và dịch giọng nói thành công!', 'success');
        } else {
          if (res.errorCode === 'NO_API_KEY') {
            setErrorBanner(res.error || 'Cần cấu hình Gemini API Key (miễn phí 100%) hoặc OpenAI Key để nhận diện giọng nói trong Electron.');
          } else {
            showToast(res.error || 'Không nhận diện được giọng nói. Vui lòng thử lại!', 'warning');
          }
        }
      };
    } catch (err: any) {
      setIsProcessing(false);
      console.error('Audio processing error:', err);
      showToast('Lỗi khi gửi dữ liệu âm thanh.', 'error');
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopMicrophone();
      showToast('Đang phân tích đoạn ghi âm...', 'info');
    } else {
      setTranscript('');
      setTranslation('');
      setPinyin('');
      startMicrophone();
    }
  };

  // Language swap handler
  const handleSwapLanguages = () => {
    const srcLangCode = sourceLang.split('-')[0].toLowerCase() as SupportedLanguage;
    const tgtMeta = POPULAR_LANGUAGES.find((l) => l.code === targetLang);
    const newSpeechLocale = tgtMeta?.speechLocale || `${targetLang}-${targetLang.toUpperCase()}`;
    setSourceLang(newSpeechLocale);
    setTargetLang(srcLangCode);
  };

  // Quick API Key Save
  const handleSaveQuickKey = async () => {
    if (!quickKeyInput.trim()) return;
    setIsSavingKey(true);
    try {
      await updateSettings({
        providers: {
          ...settings.providers,
          geminiApiKey: quickKeyInput.trim(),
        },
      });
      showToast('Đã lưu Gemini API Key thành công! Bạn có thể bắt đầu nói ngay.', 'success');
      setErrorBanner(null);
      setQuickKeyInput('');
    } catch (err: any) {
      showToast(`Không thể lưu API Key: ${err.message}`, 'error');
    } finally {
      setIsSavingKey(false);
    }
  };

  // Copy handler
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Đã sao chép vào bộ nhớ tạm!', 'success');
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Demo sample voice phrases
  const samplePhrases = [
    {
      title: 'Chào hỏi tiếng Trung',
      source: 'zh-CN',
      target: 'vi',
      text: '你好，很高兴认识你！',
      pinyin: 'nǐ hǎo, hěn gāoxìng rènshí nǐ!',
      translation: 'Xin chào, rất vui được làm quen với bạn!',
    },
    {
      title: 'Học tập & Giao tiếp',
      source: 'zh-CN',
      target: 'vi',
      text: '我想学好中文，你觉得每天应该学几个小时？',
      pinyin: 'wǒ xiǎng xué hǎo zhōngwén, nǐ juéde měitiān yīnggāi xué jǐ ge xiǎoshí?',
      translation: 'Tôi muốn học tốt tiếng Trung, bạn nghĩ mỗi ngày nên học mấy tiếng?',
    },
    {
      title: 'Tiếng Anh du lịch',
      source: 'en-US',
      target: 'vi',
      text: 'Could you please recommend a good Vietnamese restaurant near here?',
      pinyin: '',
      translation: 'Bạn có thể giới thiệu một nhà hàng Việt Nam ngon ở gần đây không?',
    },
    {
      title: 'Giao tiếp hàng ngày',
      source: 'en-US',
      target: 'vi',
      text: 'The weather today is truly wonderful, let us go for a walk together.',
      pinyin: '',
      translation: 'Thời tiết hôm nay thật tuyệt vời, chúng ta hãy cùng nhau đi dạo nhé.',
    },
  ];

  const handleRunSample = async (item: typeof samplePhrases[0]) => {
    setSourceLang(item.source as any);
    setTargetLang(item.target as any);
    setTranscript(item.text);
    setPinyin(item.pinyin);
    setTranslation(item.translation);

    // Play native TTS audio
    await soundManager.playText(item.text, item.source, false);

    // Broadcast to subtitle overlay
    window.electronAPI?.sendSubtitleEntry({
      original: item.text,
      pinyin: item.pinyin,
      translation: item.translation,
    }, true);

    // Add to session history
    const newItem: VoiceSessionItem = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      sourceLang: item.source,
      targetLang: item.target,
      transcript: item.text,
      pinyin: item.pinyin,
      translation: item.translation,
    };
    setSessionHistory((prev) => [newItem, ...prev.slice(0, 19)]);

    showToast('Đã phát giọng đọc mẫu và gửi đến phụ đề nổi!', 'success');
  };

  const handleSaveToVocab = async (text: string, trans: string, pyn?: string, lang?: string) => {
    if (!text || !trans) return;
    const l = lang ? (lang.startsWith('zh') ? 'zh' : 'en') : (sourceLang === 'zh-CN' ? 'zh' : 'en');
    await saveWord({
      word: text,
      language: l as any,
      translation: trans,
      pinyin: pyn,
      source: 'voice_translator',
    });
    showToast('Đã lưu câu vào sổ từ vựng!', 'success');
  };

  // Format seconds to mm:ss
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Mic className="w-6 h-6 text-primary" />
            <span>{dict.voice.title}</span>
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Dịch giọng nói hai chiều trực tiếp qua micro, tự động sinh Pinyin và đồng bộ lên phụ đề nổi.
          </p>
        </div>

        {/* Action Controls & Subtitle Shortcut */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              window.electronAPI?.openSubtitleOverlay();
              showToast('Đã mở cửa sổ phụ đề nổi!', 'info');
            }}
            className="px-3.5 py-2 rounded-2xl bg-surface hover:bg-surface-hover border border-border text-foreground font-semibold text-xs shadow-google-sm flex items-center gap-1.5 transition-all"
            title="Mở cửa sổ phụ đề nổi ghim trên màn hình"
          >
            <Subtitles className="w-4 h-4 text-primary" />
            <span>Mở Phụ Đề Nổi</span>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-2xl bg-surface hover:bg-surface-hover border border-border text-foreground shadow-google-sm transition-colors"
            title="Mở trang cài đặt"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Language Switcher Bar */}
      <div className="p-4 bg-card border border-border rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-google-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Cặp ngôn ngữ:
          </span>

          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value as any)}
            className="bg-surface border border-border text-foreground rounded-2xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-primary shadow-google-sm"
          >
            {POPULAR_LANGUAGES.map((l) => (
              <option key={l.speechLocale} value={l.speechLocale}>
                {l.flag} Nói {l.nativeName} ({l.speechLocale})
              </option>
            ))}
          </select>

          <button
            onClick={handleSwapLanguages}
            className="p-2 rounded-xl bg-surface hover:bg-surface-hover border border-border text-muted-foreground hover:text-primary transition-all shadow-google-sm"
            title="Đảo chiều ngôn ngữ nói ↔ dịch"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value as any)}
            className="bg-surface border border-border text-foreground rounded-2xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-primary shadow-google-sm"
          >
            {POPULAR_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} Dịch sang {l.nativeName} ({l.name})
              </option>
            ))}
          </select>
        </div>

        {/* Feature Toggles: Silence Detection & Continuous Mode */}
        <div className="flex items-center gap-4 text-xs font-medium text-foreground">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoStopSilence}
              onChange={(e) => setAutoStopSilence(e.target.checked)}
              className="rounded accent-primary w-4 h-4 cursor-pointer"
            />
            <span title="Tự động kết thúc câu và dịch khi bạn ngừng nói 1.4 giây">
              Tự nhận diện khi ngưng nói
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={continuousMode}
              onChange={(e) => setContinuousMode(e.target.checked)}
              className="rounded accent-primary w-4 h-4 cursor-pointer"
            />
            <span title="Tự động thu âm câu tiếp theo sau mỗi lần dịch xong">
              Hội thoại liên tục
            </span>
          </label>
        </div>
      </div>

      {/* Quick API Key Setup Banner if not configured */}
      {!hasApiKey && (
        <div className="p-4 bg-primary-muted border border-primary/30 rounded-3xl space-y-3 shadow-google-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <Key className="w-4 h-4 text-primary" />
              <span className="font-bold text-foreground">
                Kích hoạt nhận diện giọng nói AI chính xác nhất (Miễn phí 100%)
              </span>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              <span>Lấy Gemini API Key miễn phí tại Google AI Studio</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Nhập Google Gemini API Key bên dưới để kích hoạt tính năng micro trong ứng dụng:
          </p>

          <div className="flex items-center gap-2">
            <input
              type="password"
              value={quickKeyInput}
              onChange={(e) => setQuickKeyInput(e.target.value)}
              placeholder="Dán Gemini API Key (AIzaSy...)"
              className="flex-1 bg-surface border border-border text-foreground px-3.5 py-2 rounded-2xl text-xs focus:outline-none focus:border-primary shadow-google-sm font-mono"
            />
            <button
              onClick={handleSaveQuickKey}
              disabled={isSavingKey || !quickKeyInput.trim()}
              className="px-4 py-2 rounded-2xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground font-semibold text-xs shadow-google-sm transition-all flex items-center gap-1.5"
            >
              {isSavingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Lưu & Bắt đầu</span>
            </button>
          </div>
        </div>
      )}

      {/* Error alert banner */}
      {errorBanner && (
        <div className="p-4 bg-destructive-muted border border-destructive/30 rounded-3xl flex items-start gap-3 text-xs text-destructive shadow-google-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Lưu ý dịch giọng nói:</span>
            <p className="mt-0.5 leading-relaxed">{errorBanner}</p>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="px-3 py-1 rounded-xl bg-surface border border-border text-foreground hover:bg-surface-hover font-semibold transition-colors"
          >
            Mở Cài đặt
          </button>
        </div>
      )}

      {/* Main Recording Station Card */}
      <div className="p-8 bg-card border border-border rounded-3xl flex flex-col items-center justify-center space-y-6 shadow-google-md relative overflow-hidden">
        {/* Dynamic Voice Wave Ripple effect */}
        {isListening && (
          <div
            className="absolute rounded-full bg-primary/20 pointer-events-none transition-all duration-75"
            style={{
              width: `${140 + audioLevel * 2.2}px`,
              height: `${140 + audioLevel * 2.2}px`,
            }}
          />
        )}

        {/* Microphone Button */}
        <button
          onClick={toggleListening}
          disabled={isProcessing}
          className={`w-28 h-28 rounded-full flex items-center justify-center shadow-google-lg transition-all z-10 cursor-pointer ${
            isProcessing
              ? 'bg-primary/70 text-primary-foreground'
              : isListening
              ? 'bg-destructive hover:opacity-90 text-destructive-foreground ring-8 ring-destructive/20 animate-pulse'
              : 'bg-primary hover:bg-primary-hover text-primary-foreground hover:scale-105 ring-4 ring-primary/20'
          }`}
          title={isListening ? 'Bấm để dừng ghi và dịch ngay' : 'Bấm để bắt đầu thu âm giọng nói'}
        >
          {isProcessing ? (
            <Loader2 className="w-12 h-12 animate-spin" />
          ) : isListening ? (
            <MicOff className="w-12 h-12" />
          ) : (
            <Mic className="w-12 h-12" />
          )}
        </button>

        {/* Status & Live Frequency Equalizer */}
        <div className="text-center z-10 space-y-2">
          <div className="flex items-center justify-center gap-2">
            {isListening && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/15 text-destructive text-xs font-bold font-mono border border-destructive/20">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>{formatTime(recordingSeconds)}</span>
              </span>
            )}
            <h3 className="text-lg font-bold text-foreground">
              {isProcessing
                ? 'Đang nhận diện giọng nói & dịch thuật AI...'
                : isListening
                ? autoStopSilence
                  ? 'Đang lắng nghe... Ngừng nói 1.4s để tự động dịch'
                  : 'Đang lắng nghe... Bấm mic khi nói xong'
                : dict.voice.startListening}
            </h3>
          </div>

          <p className="text-xs text-muted-foreground">
            {isListening
              ? `Micro đang thu âm [${sourceLang === 'zh-CN' ? 'Tiếng Trung' : sourceLang === 'en-US' ? 'Tiếng Anh' : 'Tiếng Việt'}]`
              : 'Nhấn vào biểu tượng micro để nói, hoặc thử các câu thoại mẫu sẵn bên dưới'}
          </p>

          {/* Equalizer Bars when listening */}
          {isListening && (
            <div className="flex items-center justify-center gap-1 pt-1 h-6">
              {[0.5, 0.9, 1.4, 0.8, 1.2, 0.6, 1.0].map((multiplier, idx) => {
                const height = Math.max(4, Math.min(24, Math.round((audioLevel / 4) * multiplier)));
                return (
                  <div
                    key={idx}
                    className="w-1.5 bg-primary rounded-full transition-all duration-75"
                    style={{ height: `${height}px` }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Real-Time Dual Panels: Transcript & Translation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Source Spoken Text Panel */}
        <div className="p-6 bg-card border border-border rounded-3xl space-y-3.5 shadow-google-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-primary" />
                <span>Nội dung vừa nói ({sourceLang}):</span>
              </span>
              {transcript && (
                <div className="flex items-center gap-1.5">
                  <AudioPlayer text={transcript} lang={sourceLang.startsWith('zh') ? 'zh' : 'en'} size="sm" />
                  <button
                    onClick={() => handleCopyText(transcript, 'current_src')}
                    className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                    title="Sao chép"
                  >
                    {copiedId === 'current_src' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            <div className="min-h-[110px] text-lg font-medium text-foreground leading-relaxed">
              {transcript || <span className="text-muted-foreground/50 italic text-base">Văn bản nhận diện từ micro sẽ hiển thị tại đây...</span>}
            </div>
          </div>

          {pinyin && (
            <div className="p-3 bg-surface rounded-2xl border border-border shadow-google-sm">
              <TonePinyin pinyin={pinyin} className="text-xs font-medium" />
            </div>
          )}
        </div>

        {/* Target Translation Panel */}
        <div className="p-6 bg-card border border-border rounded-3xl space-y-3.5 shadow-google-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-xs font-bold text-success uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-success" />
                <span>{dict.voice.realtimeTranscript} ({targetLang}):</span>
              </span>
              {translation && (
                <div className="flex items-center gap-1.5">
                  <AudioPlayer text={translation} lang={targetLang as any} size="sm" />
                  <button
                    onClick={() => handleCopyText(translation, 'current_tgt')}
                    className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                    title="Sao chép bản dịch"
                  >
                    {copiedId === 'current_tgt' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleSaveToVocab(transcript, translation, pinyin, sourceLang)}
                    className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
                    title="Lưu câu vào sổ từ vựng"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="min-h-[110px] text-lg font-semibold text-success leading-relaxed">
              {translation || <span className="text-muted-foreground/50 italic text-base font-normal">Bản dịch thời gian thực sẽ xuất hiện tại đây...</span>}
            </div>
          </div>

          {translation && (
            <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1">
              <span>Đã đồng bộ lên cửa sổ phụ đề nổi</span>
              <span className="text-primary font-medium">Sẵn sàng đàm thoại</span>
            </div>
          )}
        </div>
      </div>

      {/* Session Conversation Log */}
      {sessionHistory.length > 0 && (
        <div className="p-6 bg-card border border-border rounded-3xl space-y-4 shadow-google-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-primary" />
              <span>Lịch sử hội thoại phiên này ({sessionHistory.length} câu)</span>
            </h3>
            <button
              onClick={() => setSessionHistory([])}
              className="text-[11px] text-muted-foreground hover:text-destructive transition-colors font-medium"
            >
              Xóa lịch sử phiên
            </button>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {sessionHistory.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-surface rounded-2xl border border-border space-y-2 text-xs shadow-google-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-surface-hover border border-border font-mono text-[10px] text-muted-foreground">
                      {item.time}
                    </span>
                    <span className="font-semibold text-primary">
                      {item.sourceLang} → {item.targetLang}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <AudioPlayer text={item.transcript} lang={item.sourceLang.startsWith('zh') ? 'zh' : 'en'} size="sm" />
                    <button
                      onClick={() => handleCopyText(`${item.transcript} - ${item.translation}`, item.id)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground"
                      title="Sao chép"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleSaveToVocab(item.transcript, item.translation, item.pinyin, item.sourceLang)}
                      className="p-1 rounded text-muted-foreground hover:text-primary"
                      title="Lưu vào từ vựng"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-medium text-foreground text-sm">{item.transcript}</div>
                  {item.pinyin && <TonePinyin pinyin={item.pinyin} className="text-[11px] text-primary" />}
                  <div className="font-semibold text-success">{item.translation}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Sample Voice Showcase */}
      <div className="p-6 bg-card border border-border rounded-3xl space-y-4 shadow-google-sm">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Thử nghiệm nhanh với giọng đọc mẫu (Sample Voice Showcase)
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground">Bấm để nghe & kiểm tra luồng dịch phụ đề nổi</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {samplePhrases.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleRunSample(item)}
              className="p-4 bg-surface hover:bg-surface-hover border border-border rounded-2xl text-left transition-all hover:border-primary/40 space-y-1.5 shadow-google-sm group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary group-hover:underline">
                  {item.title}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-surface-hover text-muted-foreground border border-border font-mono">
                  {item.source} → {item.target}
                </span>
              </div>
              <p className="text-xs font-medium text-foreground truncate">{item.text}</p>
              {item.pinyin && <p className="text-[11px] text-primary/80 truncate font-mono">{item.pinyin}</p>}
              <p className="text-xs text-muted-foreground truncate">{item.translation}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
