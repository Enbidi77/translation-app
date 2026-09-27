import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Crop, 
  Mic, 
  ScanText, 
  Subtitles, 
  BookA, 
  Layers, 
  Sparkles, 
  Flame, 
  ArrowUpRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useFlashcardStore } from '../stores/useFlashcardStore';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { dict } = useSettingsStore();
  const { stats, fetchDueCards } = useFlashcardStore();
  const [statsData, setStatsData] = useState<any>(null);

  useEffect(() => {
    fetchDueCards();
    if (window.electronAPI) {
      window.electronAPI.getStatistics().then(setStatsData).catch(console.error);
    }
  }, []);

  const handleScreenTranslate = () => window.electronAPI?.triggerSnip();

  const today = statsData?.summary?.today || {
    wordsLearned: 12,
    wordsReviewed: 28,
    listeningMinutes: 15,
    speakingMinutes: 8,
    studyMinutesChinese: 25,
    studyMinutesEnglish: 15,
    streakDays: 5,
  };

  const totals = statsData?.summary?.totals || {
    totalWords: 12,
    totalReviews: 28,
    totalTranslations: 45,
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto overflow-y-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-surface border border-border shadow-google-sm transition-all">
        <div>
          <div className="flex items-center gap-2 text-primary font-medium text-xs tracking-wider uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Language Companion</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            {dict.dashboard.title}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Học tiếng Trung (HSK) & tiếng Anh (CEFR) qua dịch màn hình, quét OCR và ôn tập lặp lại ngắt quãng.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-surface-hover border border-border p-3 rounded-2xl shadow-google-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-warning-muted border border-warning/30 flex items-center justify-center text-warning">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground leading-tight">{today.streakDays} Ngày</div>
              <div className="text-[11px] text-muted-foreground">{dict.dashboard.streak}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Learning Progress */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Chinese Progress */}
        <div className="p-4 rounded-2xl bg-card border border-border space-y-3 shadow-google-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">{dict.dashboard.chineseGoal}</span>
            <span className="text-xs font-bold text-destructive">70%</span>
          </div>
          <div className="w-full bg-surface-hover h-2 rounded-full overflow-hidden">
            <div className="bg-destructive h-full rounded-full w-[70%]" />
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Mục tiêu HSK 3-4</span>
            <span className="text-foreground font-semibold">25 / 35 phút</span>
          </div>
        </div>

        {/* English Progress */}
        <div className="p-4 rounded-2xl bg-card border border-border space-y-3 shadow-google-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">{dict.dashboard.englishGoal}</span>
            <span className="text-xs font-bold text-primary">50%</span>
          </div>
          <div className="w-full bg-surface-hover h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full w-[50%]" />
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Mục tiêu CEFR B2</span>
            <span className="text-foreground font-semibold">15 / 30 phút</span>
          </div>
        </div>

        {/* Words Stats */}
        <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3 shadow-google-sm">
          <div className="w-10 h-10 rounded-xl bg-success-muted border border-success/30 flex items-center justify-center text-success">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">{today.wordsLearned} từ</div>
            <div className="text-[11px] text-muted-foreground">{dict.dashboard.newWords} hôm nay</div>
          </div>
        </div>

        {/* Review Due */}
        <div 
          onClick={() => navigate('/flashcards')}
          className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors shadow-google-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning-muted border border-warning/30 flex items-center justify-center text-warning">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">{stats.due} thẻ</div>
              <div className="text-[11px] text-muted-foreground">{dict.dashboard.reviewDue}</div>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {dict.dashboard.quickActions}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={handleScreenTranslate}
            className="p-4 rounded-2xl bg-card hover:bg-card-hover border border-border hover:border-primary/40 flex flex-col items-center justify-center text-center gap-2 group transition-all shadow-google-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-muted text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Crop className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-foreground">Dịch màn hình</span>
            <kbd className="text-[10px] text-muted-foreground font-mono bg-surface-hover px-1 py-0.5 rounded border border-border">
              Ctrl+Shift+T
            </kbd>
          </button>

          <button
            onClick={() => navigate('/voice')}
            className="p-4 rounded-2xl bg-card hover:bg-card-hover border border-border hover:border-success/40 flex flex-col items-center justify-center text-center gap-2 group transition-all shadow-google-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-success-muted text-success flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mic className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-foreground">Dịch giọng nói</span>
            <kbd className="text-[10px] text-muted-foreground font-mono bg-surface-hover px-1 py-0.5 rounded border border-border">
              Ctrl+Shift+L
            </kbd>
          </button>

          <button
            onClick={() => navigate('/ocr')}
            className="p-4 rounded-2xl bg-card hover:bg-card-hover border border-border hover:border-primary/40 flex flex-col items-center justify-center text-center gap-2 group transition-all shadow-google-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-muted text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <ScanText className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-foreground">Quét chữ OCR</span>
            <kbd className="text-[10px] text-muted-foreground font-mono bg-surface-hover px-1 py-0.5 rounded border border-border">
              Ctrl+Shift+O
            </kbd>
          </button>

          <button
            onClick={() => window.electronAPI?.openSubtitleOverlay()}
            className="p-4 rounded-2xl bg-card hover:bg-card-hover border border-border hover:border-primary/40 flex flex-col items-center justify-center text-center gap-2 group transition-all shadow-google-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-muted text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Subtitles className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-foreground">Phụ đề nổi</span>
            <kbd className="text-[10px] text-muted-foreground font-mono bg-surface-hover px-1 py-0.5 rounded border border-border">
              Ctrl+Shift+S
            </kbd>
          </button>

          <button
            onClick={() => navigate('/dictionary')}
            className="p-4 rounded-2xl bg-card hover:bg-card-hover border border-border hover:border-warning/40 flex flex-col items-center justify-center text-center gap-2 group transition-all shadow-google-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-warning-muted text-warning flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookA className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-foreground">Từ điển nhanh</span>
            <span className="text-[10px] text-muted-foreground">Tra Hán - Việt</span>
          </button>

          <button
            onClick={() => navigate('/flashcards')}
            className="p-4 rounded-2xl bg-card hover:bg-card-hover border border-border hover:border-destructive/40 flex flex-col items-center justify-center text-center gap-2 group transition-all shadow-google-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-destructive-muted text-destructive flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-foreground">Ôn tập SRS</span>
            <span className="text-[10px] text-warning font-bold">{stats.due} thẻ cần ôn</span>
          </button>
        </div>
      </div>

      {/* Overview Summary Info */}
      <div className="p-5 rounded-3xl bg-card border border-border space-y-3 shadow-google-sm">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-success" />
          <span>Tổng kết kho tri thức</span>
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-surface-hover rounded-2xl border border-border">
            <div className="text-2xl font-bold text-foreground">{totals.totalWords}</div>
            <div className="text-xs text-muted-foreground mt-1">Từ vựng đã tích lũy</div>
          </div>
          <div className="p-3 bg-surface-hover rounded-2xl border border-border">
            <div className="text-2xl font-bold text-foreground">{totals.totalReviews}</div>
            <div className="text-xs text-muted-foreground mt-1">Lượt ôn tập Spaced Repetition</div>
          </div>
          <div className="p-3 bg-surface-hover rounded-2xl border border-border">
            <div className="text-2xl font-bold text-foreground">{totals.totalTranslations}</div>
            <div className="text-xs text-muted-foreground mt-1">Lượt tra cứu & quét màn hình</div>
          </div>
        </div>
      </div>
    </div>
  );
};
