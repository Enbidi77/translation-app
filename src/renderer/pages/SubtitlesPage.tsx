import React, { useState } from 'react';
import { 
  Subtitles, 
  FileVideo, 
  Download, 
  Sliders, 
  FileText 
} from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useAppStore } from '../stores/useAppStore';
import { TonePinyin } from '../components/common/TonePinyin';

interface SubtitleLine {
  id: number;
  startTime: string;
  endTime: string;
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

export const SubtitlesPage: React.FC = () => {
  const { dict, settings, updateSettings } = useSettingsStore();
  const { showToast } = useAppStore();

  const [subtitlesList] = useState<SubtitleLine[]>([
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
  ]);

  const handleToggleOverlay = () => {
    window.electronAPI?.openSubtitleOverlay();
    showToast('Đã mở cửa sổ phụ đề nổi!', 'info');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{dict.subtitles.title}</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Cửa sổ phụ đề nổi ghim trên màn hình khi xem phim, chơi game, xem YouTube và trích xuất phụ đề video.
          </p>
        </div>

        <button
          onClick={handleToggleOverlay}
          className="px-4 py-2 rounded-2xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs shadow-google-sm flex items-center gap-2 transition-all"
        >
          <Subtitles className="w-4 h-4" />
          <span>{dict.subtitles.toggleOverlay}</span>
        </button>
      </div>

      {/* Floating Subtitle Controls Banner */}
      <div className="p-5 bg-card border border-border rounded-3xl space-y-4 shadow-google-md">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-primary" />
          <span>Cấu hình hiển thị phụ đề nổi</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
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
        </div>
      </div>

      {/* Media Transcription & Subtitles Table */}
      <div className="p-5 bg-card border border-border rounded-3xl space-y-4 shadow-google-md">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FileVideo className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold text-foreground">Danh sách phụ đề song ngữ mẫu</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportSrt}
              className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-hover text-foreground border border-border text-xs font-medium flex items-center gap-1.5 transition-colors shadow-google-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{dict.subtitles.exportSrt}</span>
            </button>
            <button
              onClick={handleExportVtt}
              className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-hover text-foreground border border-border text-xs font-medium flex items-center gap-1.5 transition-colors shadow-google-sm"
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
              className="p-4 bg-surface rounded-2xl border border-border space-y-2 hover:border-primary/40 transition-colors shadow-google-sm"
            >
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                <span>{sub.startTime} ➔ {sub.endTime}</span>
                <span className="text-primary font-semibold">Dòng #{sub.id}</span>
              </div>

              <div className="text-base font-bold text-foreground tracking-wide">
                {sub.chinese}
              </div>

              <div className="text-xs">
                <TonePinyin pinyin={sub.pinyin} />
              </div>

              <div className="text-xs font-medium text-success">
                {sub.vietnamese}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
