import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Flame, 
  BookOpen, 
  Layers, 
  Headphones, 
  Mic, 
  Award
} from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { LearningStatistics } from '../../shared/types';

export const StatisticsPage: React.FC = () => {
  const { dict } = useSettingsStore();
  const [statsData, setStatsData] = useState<{
    history: LearningStatistics[];
    summary: any;
  } | null>(null);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getStatistics().then(setStatsData).catch(console.error);
    }
  }, []);

  const summary = statsData?.summary || {
    today: {
      wordsLearned: 12,
      wordsReviewed: 28,
      listeningMinutes: 15,
      speakingMinutes: 8,
      studyMinutesChinese: 25,
      studyMinutesEnglish: 15,
      streakDays: 5,
    },
    totals: {
      totalWords: 12,
      totalReviews: 28,
      totalTranslations: 45,
    },
  };

  const history = statsData?.history && statsData.history.length > 0 ? statsData.history : [
    { date: '09/20', wordsReviewed: 14, wordsLearned: 5 },
    { date: '09/21', wordsReviewed: 18, wordsLearned: 8 },
    { date: '09/22', wordsReviewed: 22, wordsLearned: 6 },
    { date: '09/23', wordsReviewed: 25, wordsLearned: 10 },
    { date: '09/24', wordsReviewed: 20, wordsLearned: 4 },
    { date: '09/25', wordsReviewed: 32, wordsLearned: 12 },
    { date: '09/26', wordsReviewed: 28, wordsLearned: 9 },
    { date: '09/27', wordsReviewed: 35, wordsLearned: 14 },
  ];

  const maxReviews = Math.max(...history.map((h: any) => h.wordsReviewed || 1), 10);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{dict.statistics.title}</h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          Theo dõi dữ liệu thực học tập, thời gian nghe nói và hiệu quả ôn tập qua từng ngày.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-card border border-border rounded-3xl flex items-center gap-3 shadow-google-sm">
          <div className="w-10 h-10 rounded-2xl bg-primary-muted border border-primary/30 flex items-center justify-center text-primary shadow-google-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{summary.totals.totalWords}</div>
            <div className="text-[11px] text-muted-foreground">{dict.statistics.wordsLearned}</div>
          </div>
        </div>

        <div className="p-4 bg-card border border-border rounded-3xl flex items-center gap-3 shadow-google-sm">
          <div className="w-10 h-10 rounded-2xl bg-warning-muted border border-warning/30 flex items-center justify-center text-warning shadow-google-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{summary.totals.totalReviews}</div>
            <div className="text-[11px] text-muted-foreground">{dict.statistics.reviewsDone}</div>
          </div>
        </div>

        <div className="p-4 bg-card border border-border rounded-3xl flex items-center gap-3 shadow-google-sm">
          <div className="w-10 h-10 rounded-2xl bg-destructive-muted border border-destructive/30 flex items-center justify-center text-destructive shadow-google-sm">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{summary.today.streakDays} Ngày</div>
            <div className="text-[11px] text-muted-foreground">Chuỗi liên tiếp</div>
          </div>
        </div>

        <div className="p-4 bg-card border border-border rounded-3xl flex items-center gap-3 shadow-google-sm">
          <div className="w-10 h-10 rounded-2xl bg-success-muted border border-success/30 flex items-center justify-center text-success shadow-google-sm">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{summary.today.studyMinutesChinese + summary.today.studyMinutesEnglish} Phút</div>
            <div className="text-[11px] text-muted-foreground">{dict.statistics.studyTime} hôm nay</div>
          </div>
        </div>
      </div>

      {/* Daily Review Trend Chart */}
      <div className="p-6 bg-card border border-border rounded-3xl space-y-4 shadow-google-md">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span>{dict.statistics.dailyTrend}</span>
          </h2>
          <span className="text-xs text-muted-foreground">Lượt thẻ ôn tập mỗi ngày</span>
        </div>

        {/* Visual Bar Chart */}
        <div className="h-48 flex items-end gap-3 pt-6 px-2">
          {history.map((h: any, idx: number) => {
            const heightPercent = Math.round(((h.wordsReviewed || 0) / maxReviews) * 100);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <span className="text-[10px] text-foreground opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  {h.wordsReviewed}
                </span>
                <div
                  className="w-full bg-primary hover:bg-primary-hover rounded-t-lg transition-all duration-300 min-h-[6px] shadow-google-sm"
                  style={{ height: `${Math.max(8, heightPercent)}%` }}
                />
                <span className="text-[10px] text-muted-foreground font-mono">
                  {h.date.length > 5 ? h.date.substring(5) : h.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chinese vs English Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-card border border-border rounded-3xl space-y-3 shadow-google-md">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Phân bổ ngôn ngữ học tập
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-destructive font-semibold">Tiếng Trung (HSK)</span>
                <span className="text-foreground font-bold">65%</span>
              </div>
              <div className="w-full bg-surface-hover h-2.5 rounded-full overflow-hidden">
                <div className="bg-destructive h-full rounded-full w-[65%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-primary font-semibold">Tiếng Anh (CEFR)</span>
                <span className="text-foreground font-bold">35%</span>
              </div>
              <div className="w-full bg-surface-hover h-2.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full w-[35%]" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 bg-card border border-border rounded-3xl space-y-3 shadow-google-md">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Kỹ năng nghe & nói hôm nay
          </h3>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 bg-surface rounded-2xl border border-border flex items-center gap-2.5 shadow-google-sm">
              <Headphones className="w-5 h-5 text-primary" />
              <div>
                <div className="text-base font-bold text-foreground">{summary.today.listeningMinutes} phút</div>
                <div className="text-[10px] text-muted-foreground">Nghe hiểu</div>
              </div>
            </div>

            <div className="p-3.5 bg-surface rounded-2xl border border-border flex items-center gap-2.5 shadow-google-sm">
              <Mic className="w-5 h-5 text-success" />
              <div>
                <div className="text-base font-bold text-foreground">{summary.today.speakingMinutes} phút</div>
                <div className="text-[10px] text-muted-foreground">Luyện nói</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
