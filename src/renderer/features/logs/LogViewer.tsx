import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ScrollText, 
  Download, 
  Trash2, 
  RefreshCw, 
  Radio, 
  Pause, 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  FileJson,
  FileText
} from 'lucide-react';
import { 
  LogItem, 
  LogLevel, 
  LogQueryFilter, 
  LogQueryResult, 
  LogStats as LogStatsType,
  ErrorSummaryItem,
  LogExportFormat
} from '../../../shared/types/logging';
import { LogStats } from './LogStats';
import { LogFilters } from './LogFilters';
import { LogDetails } from './LogDetails';
import { useAppStore } from '../../stores/useAppStore';

export const LogViewer: React.FC = () => {
  const { showToast } = useAppStore();

  const [logs, setLogs] = useState<LogItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<LogStatsType | null>(null);

  // Filter state
  const [filter, setFilter] = useState<LogQueryFilter>({
    page: 1,
    limit: 50,
    sortOrder: 'desc',
  });

  // Selected log for detailed view
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);

  // Live real-time mode
  const [isLive, setIsLive] = useState<boolean>(true);
  const isLiveRef = useRef(isLive);
  isLiveRef.current = isLive;

  // Clear modal & Export modal
  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      if (window.electronAPI?.getLogs) {
        const res: LogQueryResult = await window.electronAPI.getLogs(filter);
        setLogs(res.items || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err: any) {
      console.error('[LogViewer] Error fetching logs:', err);
      showToast(`Lỗi tải nhật ký: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [filter, showToast]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      if (window.electronAPI?.getLogStats) {
        const res: LogStatsType = await window.electronAPI.getLogStats();
        setStats(res);
      }
    } catch (err) {
      console.error('[LogViewer] Error fetching stats:', err);
    }
  }, []);

  // Initial and reactive query fetch
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Listen to realtime logs stream
  useEffect(() => {
    if (!window.electronAPI?.onNewLog) return;

    const unsub = window.electronAPI.onNewLog((newLog: LogItem) => {
      if (!isLiveRef.current) return;

      // Update stats count in real-time
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          total: prev.total + 1,
          errorCount: newLog.level === LogLevel.ERROR ? prev.errorCount + 1 : prev.errorCount,
          fatalCount: newLog.level === LogLevel.FATAL ? prev.fatalCount + 1 : prev.fatalCount,
          warnCount: newLog.level === LogLevel.WARN ? prev.warnCount + 1 : prev.warnCount,
        };
      });

      // If user is on page 1 and no specific search filter is active, prepend new log
      if (filter.page === 1 && !filter.search && !filter.requestId) {
        setLogs((prev) => [newLog, ...prev.slice(0, (filter.limit || 50) - 1)]);
        setTotal((t) => t + 1);
      }
    });

    return () => {
      unsub?.();
    };
  }, [filter]);

  // Handle Export
  const handleExport = async (format: LogExportFormat) => {
    setExporting(true);
    try {
      if (!window.electronAPI?.exportLogs) return;
      const res = await window.electronAPI.exportLogs({ format, filter });
      
      // Create browser blob and trigger download
      const mimeType =
        format === 'json'
          ? 'application/json'
          : format === 'csv'
          ? 'text/csv'
          : 'text/plain';
      const blob = new Blob([res.content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `polyglot-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`Đã xuất ${res.count} bản ghi nhật ký (${format.toUpperCase()})`, 'success');
      setShowExportModal(false);
    } catch (err: any) {
      showToast(`Lỗi xuất nhật ký: ${err.message}`, 'error');
    } finally {
      setExporting(false);
    }
  };

  // Handle Clear
  const handleClear = async (days?: number) => {
    try {
      if (days !== undefined) {
        const res = await window.electronAPI?.deleteLogsOlderThan(days);
        showToast(`Đã xóa ${res.deletedCount} bản ghi cũ hơn ${days} ngày`, 'success');
      } else {
        const res = await window.electronAPI?.clearLogs();
        showToast(`Đã xóa toàn bộ ${res.deletedCount} bản ghi nhật ký`, 'success');
      }
      setShowClearModal(false);
      fetchLogs();
      fetchStats();
    } catch (err: any) {
      showToast(`Lỗi xóa nhật ký: ${err.message}`, 'error');
    }
  };

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case LogLevel.FATAL:
        return 'bg-red-500/20 text-red-500 border border-red-500/40 font-bold';
      case LogLevel.ERROR:
        return 'bg-destructive-muted text-destructive border border-destructive/30 font-bold';
      case LogLevel.WARN:
        return 'bg-warning-muted text-warning border border-warning/30 font-bold';
      case LogLevel.INFO:
        return 'bg-primary-muted text-primary border border-primary/30 font-semibold';
      case LogLevel.DEBUG:
        return 'bg-surface-hover text-foreground-secondary border border-border font-medium';
      case LogLevel.TRACE:
        return 'bg-surface-hover text-foreground-secondary border border-border font-medium';
      default:
        return 'bg-surface-hover text-foreground-secondary border border-border';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Nhật ký hệ thống & Giám sát
            </h1>
            {/* Live Indicator */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                isLive
                  ? 'bg-success-muted text-success border-success/30'
                  : 'bg-surface border-border text-foreground-secondary'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-success animate-pulse' : 'bg-foreground-secondary/40'}`} />
              <span>{isLive ? 'Trực tiếp (Live)' : 'Tạm dừng'}</span>
            </div>
          </div>
          <p className="text-muted-foreground text-xs mt-0.5">
            Theo dõi lỗi, chẩn đoán AI/OCR/dịch thuật, kiểm tra hiệu năng và truy vết toàn diện ứng dụng.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Pause / Resume Live toggle */}
          <button
            onClick={() => setIsLive(!isLive)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-medium transition-colors"
            title={isLive ? 'Tạm dừng cập nhật thời gian thực' : 'Bật cập nhật trực tiếp'}
          >
            {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isLive ? 'Tạm dừng' : 'Tiếp tục'}</span>
          </button>

          {/* Refresh */}
          <button
            onClick={() => {
              fetchLogs();
              fetchStats();
            }}
            disabled={isLoading}
            className="p-2 rounded-2xl border border-border bg-surface hover:bg-surface-hover text-foreground transition-colors"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
          </button>

          {/* Export */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-surface border border-border hover:bg-surface-hover text-foreground text-xs font-semibold shadow-google-sm transition-all"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>Xuất file</span>
          </button>

          {/* Clear */}
          <button
            onClick={() => setShowClearModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-destructive-muted/80 text-destructive border border-destructive/30 hover:bg-destructive-muted text-xs font-semibold shadow-google-sm transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa logs</span>
          </button>
        </div>
      </div>

      {/* Top Statistics */}
      <LogStats
        stats={stats}
        isLoading={isLoading && !stats}
        onSelectErrorFilter={(err: ErrorSummaryItem) => {
          setFilter((prev) => ({
            ...prev,
            search: err.errorName,
            level: [LogLevel.ERROR, LogLevel.FATAL],
            page: 1,
          }));
        }}
      />

      {/* Filters */}
      <LogFilters
        filter={filter}
        onChange={(newFilter) => setFilter(newFilter)}
        onReset={() => setFilter({ page: 1, limit: 50, sortOrder: 'desc' })}
      />

      {/* Log Table Container */}
      <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-google-sm select-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-background/50 text-[11px] text-foreground-secondary font-semibold">
                <th className="py-2.5 px-4 w-28">Thời gian</th>
                <th className="py-2.5 px-3 w-20">Mức độ</th>
                <th className="py-2.5 px-3 w-28">Danh mục</th>
                <th className="py-2.5 px-3 w-20">Nguồn</th>
                <th className="py-2.5 px-3 w-32">Mô-đun / Sự kiện</th>
                <th className="py-2.5 px-4">Nội dung thông điệp</th>
                <th className="py-2.5 px-4 text-right w-24">Thời lượng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-foreground-secondary">
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                        <span>Đang tải nhật ký...</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <ScrollText className="w-8 h-8 mx-auto text-foreground-secondary/40" />
                        <div className="font-medium text-foreground">Không tìm thấy bản ghi nhật ký nào</div>
                        <div className="text-[11px] text-foreground-secondary">
                          Thử thay đổi bộ lọc tìm kiếm hoặc kiểm tra lại mức độ ghi log.
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                logs.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedLog(item)}
                    className="hover:bg-surface-hover/80 cursor-pointer transition-colors group"
                  >
                    {/* Time */}
                    <td className="py-2.5 px-4 whitespace-nowrap font-mono text-[11px] text-foreground-secondary">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </td>

                    {/* Level */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] uppercase ${getLevelBadge(item.level)}`}>
                        {item.level}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-lg bg-surface border border-border text-foreground-secondary font-medium text-[10px]">
                        {item.category || 'app'}
                      </span>
                    </td>

                    {/* Source */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[10px] text-foreground-secondary">
                      {item.source || 'main'}
                    </td>

                    {/* Module / Event */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-foreground-secondary truncate max-w-[140px]">
                      {item.module ? item.module : item.event ? item.event : '—'}
                    </td>

                    {/* Message */}
                    <td className="py-2.5 px-4 text-foreground font-medium truncate max-w-md">
                      <div className="truncate group-hover:text-primary transition-colors">
                        {item.message}
                      </div>
                      {item.errorMessage && (
                        <div className="text-[10px] text-destructive truncate font-mono mt-0.5">
                          {item.errorName}: {item.errorMessage}
                        </div>
                      )}
                    </td>

                    {/* Duration */}
                    <td className="py-2.5 px-4 text-right whitespace-nowrap font-mono">
                      {item.durationMs !== null && item.durationMs !== undefined ? (
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${
                            item.durationMs >= 1000
                              ? 'bg-warning-muted text-warning'
                              : 'text-foreground-secondary'
                          }`}
                        >
                          {item.durationMs}ms
                        </span>
                      ) : (
                        <span className="text-foreground-secondary/40">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 px-6 border-t border-border bg-surface text-xs select-none">
          <div className="text-foreground-secondary text-[11px]">
            Hiển thị{' '}
            <span className="font-semibold text-foreground">
              {total === 0 ? 0 : ((filter.page || 1) - 1) * (filter.limit || 50) + 1}
            </span>{' '}
            -{' '}
            <span className="font-semibold text-foreground">
              {Math.min((filter.page || 1) * (filter.limit || 50), total)}
            </span>{' '}
            trên tổng số <span className="font-semibold text-foreground">{total.toLocaleString()}</span> logs
          </div>

          <div className="flex items-center gap-4">
            {/* Page size select */}
            <div className="flex items-center gap-1.5 text-foreground-secondary text-[11px]">
              <span>Mỗi trang:</span>
              <select
                value={filter.limit || 50}
                onChange={(e) => setFilter({ ...filter, limit: Number(e.target.value), page: 1 })}
                className="bg-background border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none cursor-pointer"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
              </select>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <button
                disabled={(filter.page || 1) <= 1}
                onClick={() => setFilter({ ...filter, page: 1 })}
                className="p-1.5 rounded-lg border border-border bg-background hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed text-foreground"
                title="Trang đầu"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={(filter.page || 1) <= 1}
                onClick={() => setFilter({ ...filter, page: (filter.page || 1) - 1 })}
                className="p-1.5 rounded-lg border border-border bg-background hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed text-foreground"
                title="Trang trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-3 py-1 font-semibold text-foreground text-[11px]">
                {filter.page || 1} / {totalPages}
              </span>

              <button
                disabled={(filter.page || 1) >= totalPages}
                onClick={() => setFilter({ ...filter, page: (filter.page || 1) + 1 })}
                className="p-1.5 rounded-lg border border-border bg-background hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed text-foreground"
                title="Trang tiếp"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={(filter.page || 1) >= totalPages}
                onClick={() => setFilter({ ...filter, page: totalPages })}
                className="p-1.5 rounded-lg border border-border bg-background hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed text-foreground"
                title="Trang cuối"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <LogDetails log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}

      {/* Clear Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface border border-border rounded-3xl p-6 shadow-google-xl space-y-5 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-destructive-muted text-destructive flex items-center justify-center border border-destructive/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Xóa nhật ký ứng dụng?</h3>
                <p className="text-foreground-secondary text-[11px]">Hành động này không thể hoàn tác.</p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleClear(7)}
                className="w-full text-left p-3 rounded-2xl border border-border hover:bg-surface-hover font-medium text-foreground transition-colors flex items-center justify-between"
              >
                <span>Xóa các log cũ hơn 7 ngày</span>
                <span className="text-[11px] text-foreground-secondary">Giữ lại 7 ngày gần nhất</span>
              </button>

              <button
                onClick={() => handleClear(30)}
                className="w-full text-left p-3 rounded-2xl border border-border hover:bg-surface-hover font-medium text-foreground transition-colors flex items-center justify-between"
              >
                <span>Xóa các log cũ hơn 30 ngày</span>
                <span className="text-[11px] text-foreground-secondary">Giữ lại 30 ngày gần nhất</span>
              </button>

              <button
                onClick={() => handleClear()}
                className="w-full text-left p-3 rounded-2xl border border-destructive/30 bg-destructive-muted/30 hover:bg-destructive-muted/60 font-semibold text-destructive transition-colors flex items-center justify-between"
              >
                <span>Xóa toàn bộ tất cả nhật ký (Clear all)</span>
                <span className="text-[11px] text-destructive/80">Toàn bộ</span>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-xl border border-border bg-surface hover:bg-surface-hover text-foreground font-medium"
              >
                Hủy bỏ (Cancel)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface border border-border rounded-3xl p-6 shadow-google-xl space-y-5 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-muted text-primary flex items-center justify-center border border-primary/30">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Xuất nhật ký đã lọc</h3>
                <p className="text-foreground-secondary text-[11px]">Dữ liệu nhạy cảm và khóa bí mật đã được tự động loại bỏ.</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                disabled={exporting}
                onClick={() => handleExport('json')}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border border-border hover:border-primary/50 hover:bg-surface-hover transition-all gap-2"
              >
                <FileJson className="w-6 h-6 text-primary" />
                <span className="font-semibold text-foreground">JSON</span>
                <span className="text-[10px] text-foreground-secondary">Chuẩn cấu trúc</span>
              </button>

              <button
                disabled={exporting}
                onClick={() => handleExport('csv')}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border border-border hover:border-primary/50 hover:bg-surface-hover transition-all gap-2"
              >
                <FileSpreadsheet className="w-6 h-6 text-success" />
                <span className="font-semibold text-foreground">CSV</span>
                <span className="text-[10px] text-foreground-secondary">Bảng tính Excel</span>
              </button>

              <button
                disabled={exporting}
                onClick={() => handleExport('txt')}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border border-border hover:border-primary/50 hover:bg-surface-hover transition-all gap-2"
              >
                <FileText className="w-6 h-6 text-foreground-secondary" />
                <span className="font-semibold text-foreground">TXT</span>
                <span className="text-[10px] text-foreground-secondary">Văn bản thuần</span>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl border border-border bg-surface hover:bg-surface-hover text-foreground font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
