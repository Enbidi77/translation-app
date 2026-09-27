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
  PlayCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useAppStore } from '../stores/useAppStore';
import { useVocabularyStore } from '../stores/useVocabularyStore';
import { SupportedLanguage } from '../../shared/types';
import { TonePinyin } from '../components/common/TonePinyin';
import { AudioPlayer } from '../components/common/AudioPlayer';
import { soundManager } from '../services/audioService';

export const VoicePage: React.FC = () => {
  const navigate = useNavigate();
  const { dict, settings } = useSettingsStore();
  const { showToast } = useAppStore();
  const { saveWord } = useVocabularyStore();

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [sourceLang, setSourceLang] = useState<'zh-CN' | 'en-US' | 'vi-VN'>('zh-CN');
  const [targetLang, setTargetLang] = useState<SupportedLanguage>('vi');
  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

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
  };

  const startMicrophone = async () => {
    setErrorBanner(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Audio level analyser for visual feedback
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
          if (audioContextRef.current && streamRef.current) {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round(avg * 1.5)));
            animFrameRef.current = requestAnimationFrame(checkLevel);
          }
        };
        checkLevel();
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
        if (blob.size > 1000) {
          await processRecordedAudio(blob, mimeType);
        }
      };

      // Start recording
      mediaRecorder.start();
      setIsListening(true);
      showToast('Đang lắng nghe qua micro... Hãy nói một câu!', 'info');
    } catch (err: any) {
      console.error('Failed to access microphone:', err);
      setIsListening(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        showToast('Quyền truy cập micro đã bị từ chối. Vui lòng cho phép quyền micro.', 'error');
        setErrorBanner('Quyền truy cập micro bị từ chối. Vui lòng kiểm tra quyền thiết bị trên Windows.');
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

        const res = await window.electronAPI.transcribeAudio({
          audioData: base64Data,
          mimeType,
          sourceLang,
          targetLang,
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
          });

          showToast('Nhận diện và dịch giọng nói thành công!', 'success');
        } else {
          if (res.errorCode === 'NO_API_KEY') {
            setErrorBanner(res.error || 'Cần cấu hình Gemini API Key (miễn phí) hoặc OpenAI Key để nhận diện giọng nói trong Electron.');
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
      // Stop recording and trigger transcription
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      stopMicrophone();
      showToast('Đang phân tích đoạn ghi âm...', 'info');
    } else {
      setTranscript('');
      setTranslation('');
      setPinyin('');
      startMicrophone();
    }
  };

  // Demo sample voice phrases to test without API key or microphone
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
    });

    showToast('Đã phát giọng đọc mẫu và hiển thị bản dịch thời gian thực!', 'success');
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
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{dict.voice.title}</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Nhận diện giọng nói trực tiếp qua micro và hiển thị bản dịch song song theo thời gian thực.
          </p>
        </div>

        {/* Language Selection */}
        <div className="flex items-center gap-2 text-xs">
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value as any)}
            className="bg-surface border border-border text-foreground rounded-xl px-3 py-1.5 focus:outline-none focus:border-primary shadow-google-sm"
          >
            <option value="zh-CN">Nói tiếng Trung (zh-CN)</option>
            <option value="en-US">Nói tiếng Anh (en-US)</option>
            <option value="vi-VN">Nói tiếng Việt (vi-VN)</option>
          </select>

          <span className="text-muted-foreground font-bold">→</span>

          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value as any)}
            className="bg-surface border border-border text-foreground rounded-xl px-3 py-1.5 focus:outline-none focus:border-primary shadow-google-sm"
          >
            <option value="vi">Dịch sang Tiếng Việt</option>
            <option value="zh">Dịch sang Tiếng Trung</option>
            <option value="en">Dịch sang Tiếng Anh</option>
          </select>
        </div>
      </div>

      {/* API Key Guidance Banner if not configured */}
      {!hasApiKey && (
        <div className="p-4 bg-primary-muted border border-primary/30 rounded-2xl flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground">
                Để nhận diện giọng nói AI chính xác nhất trong Electron:
              </span>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">
                Ứng dụng sử dụng mô hình <strong>Gemini 1.5 Flash (Miễn phí 100% từ Google)</strong> hoặc <strong>OpenAI Whisper</strong>. Hãy nhập API Key trong mục Cài đặt để kích hoạt tính năng micro không giới hạn.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-1.5 hover:bg-primary-hover transition-colors shadow-google-sm"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Mở Cài Đặt</span>
          </button>
        </div>
      )}

      {/* Error alert banner */}
      {errorBanner && (
        <div className="p-4 bg-destructive-muted border border-destructive/30 rounded-2xl flex items-start gap-2.5 text-xs text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Thông báo:</span>
            <p className="mt-0.5 leading-relaxed">{errorBanner}</p>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="px-2.5 py-1 rounded-lg bg-surface border border-border text-foreground hover:bg-surface-hover transition-colors"
          >
            Cài đặt
          </button>
        </div>
      )}

      {/* Main Microphone Action Card */}
      <div className="p-8 bg-card border border-border rounded-3xl flex flex-col items-center justify-center space-y-5 shadow-google-md relative overflow-hidden">
        {/* Dynamic audio ripple waves responding to voice volume */}
        {isListening && (
          <div
            className="absolute rounded-full bg-primary/20 pointer-events-none transition-all duration-75"
            style={{
              width: `${120 + audioLevel * 1.8}px`,
              height: `${120 + audioLevel * 1.8}px`,
            }}
          />
        )}

        <button
          onClick={toggleListening}
          disabled={isProcessing}
          className={`w-24 h-24 rounded-full flex items-center justify-center shadow-google-lg transition-all z-10 cursor-pointer ${
            isProcessing
              ? 'bg-primary/70 text-primary-foreground'
              : isListening
              ? 'bg-destructive hover:opacity-90 text-destructive-foreground animate-pulse'
              : 'bg-primary hover:bg-primary-hover text-primary-foreground hover:scale-105'
          }`}
          title={isListening ? 'Bấm để dừng ghi và nhận diện' : 'Bấm để bắt đầu nói'}
        >
          {isProcessing ? (
            <Loader2 className="w-10 h-10 animate-spin" />
          ) : isListening ? (
            <MicOff className="w-10 h-10" />
          ) : (
            <Mic className="w-10 h-10" />
          )}
        </button>

        <div className="text-center z-10 space-y-1">
          <h3 className="text-base font-bold text-foreground">
            {isProcessing
              ? 'Đang nhận diện giọng nói & dịch thuật AI...'
              : isListening
              ? 'Đang lắng nghe... Bấm lại vào nút mic khi nói xong'
              : dict.voice.startListening}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isListening
              ? `Đang thu âm giọng ${sourceLang === 'zh-CN' ? 'Tiếng Trung' : sourceLang === 'en-US' ? 'Tiếng Anh' : 'Tiếng Việt'} qua micro...`
              : 'Bấm micro để nói một câu, hoặc chọn một câu thoại mẫu bên dưới'}
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
            <div className="p-2.5 bg-surface rounded-xl border border-border shadow-google-sm">
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

      {/* Quick Sample Voice Showcase */}
      <div className="p-5 bg-card border border-border rounded-3xl space-y-3 shadow-google-sm">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Thử nghiệm nhanh với giọng đọc mẫu (Sample Voice Showcase)
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground">Bấm để nghe & trải nghiệm dịch trực tiếp</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
          {samplePhrases.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleRunSample(item)}
              className="p-3 bg-surface hover:bg-surface-hover border border-border rounded-2xl text-left transition-all hover:border-primary/40 space-y-1 shadow-google-sm group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-primary group-hover:underline">
                  {item.title}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover text-muted-foreground border border-border font-mono">
                  {item.source} → {item.target}
                </span>
              </div>
              <p className="text-xs font-medium text-foreground truncate">{item.text}</p>
              <p className="text-[11px] text-muted-foreground truncate">{item.translation}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
