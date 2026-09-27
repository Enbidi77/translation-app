import React from 'react';
import { 
  BarChart3, 
  AlertCircle, 
  AlertTriangle, 
  Flame, 
  Clock, 
  Activity,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { LogStats as LogStatsType, ErrorSummaryItem, SlowOperationItem } from '../../../shared/types/logging';

interface Props {
  stats: LogStatsType | null;
  isLoading: boolean;
  onSelectErrorFilter?: (item: ErrorSummaryItem) => void;
}

export const LogStats: React.FC<Props> = ({ stats, isLoading, onSelectErrorFilter }) => {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-surface rounded-2xl border border-border" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Logs */}
        <div className="p-3.5 bg-surface border border-border rounded-2xl shadow-google-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-muted text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-foreground-secondary">Tổng số logs</div>
            <div className="text-lg font-bold text-foreground truncate">{stats.total.toLocaleString()}</div>
          </div>
        </div>

        {/* Errors */}
        <div className="p-3.5 bg-surface border border-border rounded-2xl shadow-google-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive-muted text-destructive flex items-center justify-center shrink-0 border border-destructive/20">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-foreground-secondary">Lỗi (Errors)</div>
            <div className="text-lg font-bold text-destructive truncate">{stats.errorCount.toLocaleString()}</div>
          </div>
        </div>

        {/* Warnings */}
        <div className="p-3.5 bg-surface border border-border rounded-2xl shadow-google-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning-muted text-warning flex items-center justify-center shrink-0 border border-warning/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-foreground-secondary">Cảnh báo (Warnings)</div>
            <div className="text-lg font-bold text-warning truncate">{stats.warnCount.toLocaleString()}</div>
          </div>
        </div>

        {/* Fatal */}
        <div className="p-3.5 bg-surface border border-border rounded-2xl shadow-google-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 border border-red-500/20">
            <Flame className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-foreground-secondary">Nghiêm trọng (Fatal)</div>
            <div className="text-lg font-bold text-red-500 truncate">{stats.fatalCount.toLocaleString()}</div>
          </div>
        </div>

        {/* Avg Duration */}
        <div className="p-3.5 bg-surface border border-border rounded-2xl shadow-google-sm flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-success-muted text-success flex items-center justify-center shrink-0 border border-success/20">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-foreground-secondary">Thời gian TB</div>
            <div className="text-lg font-bold text-foreground truncate">
              {stats.avgDurationMs > 0 ? `${stats.avgDurationMs} ms` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Top Errors & Slow Operations Section */}
      {(stats.topErrors.length > 0 || stats.slowOperations.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
          {/* Top Errors */}
          {stats.topErrors.length > 0 && (
            <div className="p-3 bg-surface border border-border rounded-2xl">
              <div className="flex items-center gap-2 font-semibold text-foreground mb-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span>Lỗi phổ biến nhất (Top Errors)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {stats.topErrors.map((err, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectErrorFilter?.(err)}
                    title={`Click để lọc theo ${err.errorName}`}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-destructive-muted/60 text-destructive border border-destructive/20 hover:bg-destructive-muted transition-colors text-[11px] font-medium"
                  >
                    <span className="font-semibold">{err.errorName}</span>
                    <span className="text-[10px] text-foreground-secondary">({err.module})</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-destructive text-destructive-foreground font-bold text-[10px]">
                      {err.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Slow Operations */}
          {stats.slowOperations.length > 0 && (
            <div className="p-3 bg-surface border border-border rounded-2xl">
              <div className="flex items-center gap-2 font-semibold text-foreground mb-2">
                <Activity className="w-4 h-4 text-warning" />
                <span>Tác vụ chậm (Slow Operations ≥ 500ms)</span>
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {stats.slowOperations.slice(0, 4).map((op, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1 px-2 rounded-lg bg-surface-hover/70 text-[11px]"
                  >
                    <span className="font-medium text-foreground truncate max-w-[240px]">
                      {op.operation}
                    </span>
                    <span className="font-mono font-semibold text-warning">
                      {op.durationMs.toLocaleString()} ms
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
