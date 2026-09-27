import React, { useState, useEffect, useRef } from 'react';
import { 
  Subtitles, 
  FileVideo, 
  Download, 
  Sliders, 
  FileText,
  Mic,
  MicOff,
  Radio,
  Play,
  PlayCircle,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  Palette,
  Send,
  Plus,
  Volume2
} from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useAppStore } from '../stores/useAppStore';
import { TonePinyin } from '../components/common/TonePinyin';
import { AudioPlayer } from '../components/common/AudioPlayer';
import { SubtitleThemeMode } from '../../shared/design/theme';

interface SubtitleLine {
  id: number;
  startTime: string;
  endTime: string;
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

export const SubtitlesPage: React.FC = () => {
  const { dict, settings, updateSettings, subtitleTheme, setSubtitleTheme } = useSettingsStore();
  const { showToast } = useAppStore();

  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const [isQuickBroadcasting, setIsQuickBroadcasting] = useState(false);

  // Live microphone real-time subtitle translation
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourceLang, setSourceLang] = useState<'zh-CN' | 'en-US' | 'vi-VN'>('zh-CN');
  const [targetLang, setTargetLang] = useState<'vi' | 'zh' | 'en'>('vi');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const isListeningRef = useRef(false);

  const [subtitlesList, setSubtitlesList] = useState<SubtitleLine[]>([
    {
      id: 1,
      startTime: '00:00:01,200',
      endTime: '00:00:04,500',
      chinese: '这个角色非常适合新手使用。',
      pinyin: 'Zhège juésè fēicháng shìhé xīnshǒu shǐyòng.',
      vietnamese: 'Nhân vật này rất phù hợp cho người mới sử dụng.',
    },
    {
      id: 2,
      startTime: '00:00:05,100',
      endTime: '00:00:08,400',
      chinese: '这个游戏的操作非常简单。',
      pinyin: 'Zhège yóuxì de cāozuò fēicháng jiǎndān.',
      vietnamese: 'Cách điều khiển của game này rất đơn giản.',
    },
    {
      id: 3,
      startTime: '00:00:09,000',
      endTime: '00:00:12,600',
      chinese: '今天我们来介绍这个新角色的技能。',
      pinyin: 'Jīntiān wǒmen lái jièshào zhège xīn juésè de jìnéng.',
      vietnamese: 'Hôm nay chúng ta cùng tìm hiểu kỹ năng của nhân vật mới này.',
    },
    {
      id: 4,
      startTime: '00:00:13,200',
      endTime: '00:00:16,800',
      chinese: '欢迎大家来到今天的中文游戏直播间！',
      pinyin: 'Huānyíng dàjiā lái dào jīntiān de Zhōngwén yóuxì zhíbō jiān!',
      vietnamese: 'Chào mừng mọi người đến với buổi livestream game tiếng Trung hôm nay!',
    },
  ]);

  // Check overlay status on mount and poll occasionally
  useEffect(() => {
    checkOverlayStatus();
    const interval = setInterval(checkOverlayStatus, 2000);
    return () => {
      clearInterval(interval);
      stopMicrophone();
    };
  }, []);

  const checkOverlayStatus = async () => {
    if (window.electronAPI?.isSubtitleOverlayOpen) {
      const open = await window.electronAPI.isSubtitleOverlayOpen();
      setIsOverlayOpen(open);
    }
  };

  const handleToggleOverlay = async () => {
    if (window.electronAPI?.toggleSubtitleOverlay) {
      const open = await window.electronAPI.toggleSubtitleOverlay();
      setIsOverlayOpen(open);
      showToast(open ? 'Đã bật cửa sổ phụ đề nổi!' : 'Đã ẩn cửa sổ phụ đề nổi.', 'info');
    } else if (window.electronAPI?.openSubtitleOverlay) {
      window.electronAPI.openSubtitleOverlay();
      setIsOverlayOpen(true);
      showToast('Đã mở cửa sổ phụ đề nổi!', 'info');
    }
  };

  const handleBroadcastLine = (sub: SubtitleLine) => {
    if (window.electronAPI?.sendSubtitleEntry) {
      window.electronAPI.sendSubtitleEntry({
        original: sub.chinese,
        pinyin: sub.pinyin,
        translation: sub.vietnamese,
      }, true);
      setIsOverlayOpen(true);
      showToast(`Đã phát dòng #${sub.id} lên cửa sổ phụ đề nổi!`, 'success');
    }
  };

  const handleQuickBroadcast = async () => {
    if (!quickInput.trim()) return;
    setIsQuickBroadcasting(true);

    try {
      if (window.electronAPI?.translate) {
        const transRes = await window.electronAPI.translate({
          text: quickInput.trim(),
          sourceLang: 'auto',
          targetLang: 'vi',
          mode: 'natural',
        });

        if (window.electronAPI?.sendSubtitleEntry) {
          window.electronAPI.sendSubtitleEntry({
            original: transRes.sourceText,
            pinyin: transRes.pinyin,
            translation: transRes.translatedText,
          }, true);
          setIsOverlayOpen(true);
          showToast('Đã dịch và phát phụ đề lên màn hình!', 'success');
        }

        // Add to list as recent entry
        const newLine: SubtitleLine = {
          id: subtitlesList.length + 1,
          startTime: '00:00:00,000',
          endTime: '00:00:05,000',
          chinese: transRes.sourceText,
          pinyin: transRes.pinyin || '',
          vietnamese: transRes.translatedText,
        };
        setSubtitlesList((prev) => [newLine, ...prev]);
        setQuickInput('');
      }
    } catch (err: any) {
      showToast(`Lỗi phát phụ đề: ${err.message}`, 'error');
    } finally {
      setIsQuickBroadcasting(false);
    }
  };

  // Real-time microphone translation for live subtitles
  const stopMicrophone = () => {
    isListeningRef.current = false;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (_) {}
      mediaRecorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsListening(false);
  };

  const handleToggleLiveListening = async () => {
    if (isListening) {
      stopMicrophone();
      showToast('Đã dừng thu âm phụ đề trực tiếp.', 'info');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];

        if (blob.size > 1000 && window.electronAPI?.transcribeAudio) {
          setIsProcessing(true);
          try {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
              const base64Data = reader.result as string;
              const res = await window.electronAPI.transcribeAudio({
                audioData: base64Data,
                mimeType,
                sourceLang,
                targetLang,
              });

              setIsProcessing(false);

              if (res.success && res.transcript) {
                // Broadcast to subtitle overlay with autoShow = true
                window.electronAPI?.sendSubtitleEntry({
                  original: res.transcript,
                  pinyin: res.pinyin,
                  translation: res.translation || '',
                }, true);
                setIsOverlayOpen(true);

                // Add to subtitles list
                const newItem: SubtitleLine = {
                  id: subtitlesList.length + 1,
                  startTime: new Date().toLocaleTimeString(),
                  endTime: 'Live',
                  chinese: res.transcript,
                  pinyin: res.pinyin || '',
                  vietnamese: res.translation || '',
                };
                setSubtitlesList((prev) => [newItem, ...prev]);
                showToast('Đã cập nhật phụ đề nổi!', 'success');
              }
            };
          } catch (err) {
            setIsProcessing(false);
          }
        }

        // Continue listening if still active
        if (isListeningRef.current) {
          setTimeout(() => {
            if (isListeningRef.current) {
              handleToggleLiveListening();
            }
          }, 300);
        }
      };

      isListeningRef.current = true;
      mediaRecorder.start();
      setIsListening(true);

      // Auto ensure floating overlay is open
      if (!isOverlayOpen && window.electronAPI?.openSubtitleOverlay) {
        await window.electronAPI.openSubtitleOverlay();
        setIsOverlayOpen(true);
      }

      showToast('Đang lắng nghe... Nói một câu để phát phụ đề lên màn hình!', 'info');
    } catch (err: any) {
      setIsListening(false);
      isListeningRef.current = false;
      showToast(`Không thể mở micro: ${err.message}`, 'error');
    }
  };

  const handleExportSrt = () => {
    let srtContent = '';
    subtitlesList.forEach((sub, idx) => {
      srtContent += `${idx + 1}\n${sub.startTime} --> ${sub.endTime}\n${sub.chinese}\n${sub.pinyin}\n${sub.vietnamese}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles_chinese_vietnamese.srt';
    a.click();
    showToast('Đã tải xuống tệp SRT!', 'success');
  };

  const handleExportVtt = () => {
    let vttContent = 'WEBVTT\n\n';
    subtitlesList.forEach((sub, idx) => {
      const start = sub.startTime.replace(',', '.');
      const end = sub.endTime.replace(',', '.');
      vttContent += `${idx + 1}\n${start} --> ${end}\n${sub.chinese}\n${sub.vietnamese}\n\n`;
    });

    const blob = new Blob([vttContent], { type: 'text/vtt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.vtt';
    a.click();
    showToast('Đã tải xuống tệp VTT!', 'success');
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto">
      {/* Title & Floating Window Master Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Subtitles className="w-6 h-6 text-primary" />
            <span>{dict.subtitles.title}</span>
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Cửa sổ phụ đề nổi ghim trên màn hình khi xem phim, chơi game, xem YouTube và dịch giọng nói trực tiếp.
          </p>
        </div>

        {/* Master Floating Window Toggle with Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-surface border border-border shadow-google-sm text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isOverlayOpen ? 'bg-success animate-pulse' : 'bg-muted-foreground/40'
              }`}
            />
            <span className="font-medium text-foreground">
              {isOverlayOpen ? 'Phụ đề đang hiển thị' : 'Phụ đề đang ẩn'}
            </span>
          </div>

          <button
            onClick={handleToggleOverlay}
            className={`px-4 py-2 rounded-2xl font-semibold text-xs shadow-google-sm flex items-center gap-2 transition-all ${
              isOverlayOpen
                ? 'bg-surface hover:bg-surface-hover border border-border text-foreground'
                : 'bg-primary hover:bg-primary-hover text-primary-foreground'
            }`}
          >
            {isOverlayOpen ? <EyeOff className="w-4 h-4 text-warning" /> : <Eye className="w-4 h-4" />}
            <span>{isOverlayOpen ? 'Ẩn Cửa Sổ Phụ Đề' : dict.subtitles.toggleOverlay}</span>
          </button>
        </div>
      </div>

      {/* Real-Time Live Microphone & Broadcast Station */}
      <div className="p-6 bg-card border border-border rounded-3xl space-y-5 shadow-google-md">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Dịch & Phát Phụ Đề Trực Tiếp Thời Gian Thực (Live Translation Stream)
            </h2>
          </div>

          {/* Language selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium">Nói:</span>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value as any)}
              className="bg-surface border border-border text-foreground rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-primary shadow-google-sm"
            >
              <option value="zh-CN">Tiếng Trung (zh-CN)</option>
              <option value="en-US">Tiếng Anh (en-US)</option>
              <option value="vi-VN">Tiếng Việt (vi-VN)</option>
            </select>

            <span className="text-muted-foreground font-bold">→</span>

            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value as any)}
              className="bg-surface border border-border text-foreground rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-primary shadow-google-sm"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="zh">Tiếng Trung</option>
              <option value="en">Tiếng Anh</option>
            </select>
          </div>
        </div>

        {/* Live Mic Action & Quick Manual Text Broadcast */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Live Micro Button */}
          <div className="p-4 bg-surface rounded-2xl border border-border flex items-center justify-between shadow-google-sm">
            <div>
              <span className="text-xs font-bold text-foreground block">Thu âm qua Micro:</span>
              <span className="text-[11px] text-muted-foreground">
                {isListening ? 'Đang lắng nghe & phát phụ đề...' : 'Nói để phụ đề nổi tự nhảy chữ'}
              </span>
            </div>

            <button
              onClick={handleToggleLiveListening}
              disabled={isProcessing}
              className={`p-3 rounded-2xl font-semibold text-xs shadow-google-sm transition-all flex items-center gap-2 ${
                isListening
                  ? 'bg-destructive text-destructive-foreground animate-pulse'
                  : 'bg-primary hover:bg-primary-hover text-primary-foreground'
              }`}
              title={isListening ? 'Dừng thu âm trực tiếp' : 'Bật thu âm phụ đề trực tiếp'}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
              <span>{isListening ? 'Đang Thu' : 'Bật Micro'}</span>
            </button>
          </div>

          {/* Quick Manual Text Broadcast to Screen */}
          <div className="md:col-span-2 p-2 bg-surface rounded-2xl border border-border flex items-center gap-2 shadow-google-sm">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleQuickBroadcast();
              }}
              placeholder="Nhập hoặc dán câu tiếng Trung/Anh để phát phụ đề lên màn hình ngay..."
              className="flex-1 bg-transparent px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              onClick={handleQuickBroadcast}
              disabled={!quickInput.trim() || isQuickBroadcasting}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs shadow-google-sm flex items-center gap-1.5 disabled:opacity-50 transition-all shrink-0"
            >
              {isQuickBroadcasting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Phát Phụ Đề</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Subtitle Controls & Visual Configuration */}
      <div className="p-6 bg-card border border-border rounded-3xl space-y-4 shadow-google-md">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-primary" />
          <span>Cấu hình giao diện cửa sổ phụ đề nổi (Đồng bộ tức thì)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          {/* Font size */}
          <div className="p-3 bg-surface rounded-2xl border border-border space-y-1.5 shadow-google-sm">
            <div className="flex items-center justify-between text-foreground">
              <span>{dict.subtitles.fontSize}:</span>
              <span className="font-bold text-primary">{settings.subtitles.fontSize}px</span>
            </div>
            <input
              type="range"
              min="14"
              max="36"
              value={settings.subtitles.fontSize}
              onChange={(e) => updateSettings({ subtitles: { ...settings.subtitles, fontSize: Number(e.target.value) } })}
              className="w-full h-1 accent-primary cursor-pointer"
            />
          </div>

          {/* Opacity */}
          <div className="p-3 bg-surface rounded-2xl border border-border space-y-1.5 shadow-google-sm">
            <div className="flex items-center justify-between text-foreground">
              <span>{dict.subtitles.opacity}:</span>
              <span className="font-bold text-primary">{Math.round(settings.subtitles.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="1.0"
              step="0.05"
              value={settings.subtitles.opacity}
              onChange={(e) => updateSettings({ subtitles: { ...settings.subtitles, opacity: Number(e.target.value) } })}
              className="w-full h-1 accent-primary cursor-pointer"
            />
          </div>

          {/* Pinyin Switch */}
          <div className="p-3 bg-surface rounded-2xl border border-border flex items-center justify-between shadow-google-sm">
            <span className="text-foreground">{dict.subtitles.showPinyin}</span>
            <input
              type="checkbox"
              checked={settings.subtitles.showPinyin}
              onChange={(e) => updateSettings({ subtitles: { ...settings.subtitles, showPinyin: e.target.checked } })}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
          </div>

          {/* Subtitle Theme Mode */}
          <div className="p-3 bg-surface rounded-2xl border border-border space-y-1.5 shadow-google-sm">
            <div className="flex items-center justify-between text-foreground">
              <span className="flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-primary" />
                <span>Giao diện phụ đề:</span>
              </span>
            </div>
            <select
              value={subtitleTheme}
              onChange={(e) => setSubtitleTheme(e.target.value as SubtitleThemeMode)}
              className="w-full bg-card border border-border text-foreground rounded-xl px-2 py-1 text-xs focus:outline-none focus:border-primary"
            >
              <option value="follow_app">Theo ứng dụng</option>
              <option value="dark">Chế độ tối (Dark)</option>
              <option value="light">Chế độ sáng (Light)</option>
              <option value="transparent">Trong suốt viền mờ (Transparent)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subtitles Table with 1-Click Screen Projection */}
      <div className="p-6 bg-card border border-border rounded-3xl space-y-4 shadow-google-md">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FileVideo className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold text-foreground">
              Danh sách phụ đề song ngữ (Bấm nút "Phát" để ghim lên màn hình)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportSrt}
              className="px-3.5 py-1.5 rounded-xl bg-surface hover:bg-surface-hover text-foreground border border-border text-xs font-medium flex items-center gap-1.5 transition-colors shadow-google-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{dict.subtitles.exportSrt}</span>
            </button>
            <button
              onClick={handleExportVtt}
              className="px-3.5 py-1.5 rounded-xl bg-surface hover:bg-surface-hover text-foreground border border-border text-xs font-medium flex items-center gap-1.5 transition-colors shadow-google-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{dict.subtitles.exportVtt}</span>
            </button>
          </div>
        </div>

        {/* Subtitle Rows */}
        <div className="space-y-3">
          {subtitlesList.map((sub) => (
            <div
              key={sub.id}
              className="p-4 bg-surface rounded-2xl border border-border space-y-2 hover:border-primary/40 transition-colors shadow-google-sm group"
            >
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                <span>{sub.startTime} ➔ {sub.endTime}</span>
                <div className="flex items-center gap-2">
                  <AudioPlayer text={sub.chinese} lang="zh" size="sm" />
                  <button
                    onClick={() => handleBroadcastLine(sub)}
                    className="px-2.5 py-1 rounded-xl bg-primary-muted hover:bg-primary text-primary hover:text-primary-foreground border border-primary/30 font-sans font-semibold text-xs flex items-center gap-1 transition-all shadow-google-sm"
                    title="Gửi dòng phụ đề này lên cửa sổ nổi trên màn hình"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Phát lên màn hình</span>
                  </button>
                </div>
              </div>

              <div className="text-base font-bold text-foreground tracking-wide">
                {sub.chinese}
              </div>

              {sub.pinyin && (
                <div className="text-xs">
                  <TonePinyin pinyin={sub.pinyin} />
                </div>
              )}

              <div className="text-xs font-semibold text-success">
                {sub.vietnamese}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
