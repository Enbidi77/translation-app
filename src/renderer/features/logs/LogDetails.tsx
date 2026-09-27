import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  AlertCircle, 
  Clock, 
  Terminal, 
  Tag, 
  Activity, 
  Code,
  Layers,
  Hash
} from 'lucide-react';
import { LogItem, LogLevel } from '../../../shared/types/logging';

interface Props {
  log: LogItem | null;
  onClose: () => void;
}

export const LogDetails: React.FC<Props> = ({ log, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!log) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  let formattedMetadata = '';
  if (log.metadata) {
    try {
      formattedMetadata = JSON.stringify(JSON.parse(log.metadata), null, 2);
    } catch {
      formattedMetadata = log.metadata;
    }
  }

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case LogLevel.FATAL:
        return 'bg-red-500 text-white font-bold';
      case LogLevel.ERROR:
        return 'bg-destructive text-destructive-foreground font-bold';
      case LogLevel.WARN:
        return 'bg-warning text-warning-foreground font-bold';
      case LogLevel.INFO:
        return 'bg-primary text-primary-foreground font-semibold';
      default:
        return 'bg-surface-hover text-foreground-secondary font-medium';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-surface border border-border rounded-3xl shadow-google-xl flex flex-col overflow-hidden text-xs">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-border bg-surface">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-xl text-xs uppercase ${getLevelBadge(log.level)}`}>
              {log.level}
            </span>
            <span className="font-semibold text-foreground text-sm truncate max-w-md">
              {log.message}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-hover text-foreground-secondary hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 select-text">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-background rounded-2xl border border-border space-y-1">
              <div className="flex items-center gap-1.5 text-foreground-secondary text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                <span>Thời gian (Time)</span>
              </div>
              <div className="font-medium text-foreground">
                {new Date(log.timestamp).toLocaleString()}
              </div>
              <div className="text-[10px] text-foreground-secondary font-mono">
                {log.timestamp}
              </div>
            </div>

            <div className="p-3 bg-background rounded-2xl border border-border space-y-1">
              <div className="flex items-center gap-1.5 text-foreground-secondary text-[11px]">
                <Tag className="w-3.5 h-3.5" />
                <span>Danh mục & Nguồn</span>
              </div>
              <div className="font-medium text-foreground flex items-center gap-2">
                <span className="capitalize">{log.category || 'N/A'}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-hover text-foreground-secondary font-mono">
                  {log.source || 'N/A'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-background rounded-2xl border border-border space-y-1">
              <div className="flex items-center gap-1.5 text-foreground-secondary text-[11px]">
                <Activity className="w-3.5 h-3.5" />
                <span>Mô-đun & Sự kiện</span>
              </div>
              <div className="font-mono text-foreground truncate">
                {log.module || '—'} : {log.event || '—'}
              </div>
            </div>

            {log.durationMs !== null && (
              <div className="p-3 bg-background rounded-2xl border border-border space-y-1">
                <div className="flex items-center gap-1.5 text-foreground-secondary text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Thời gian thực thi</span>
                </div>
                <div className="font-mono font-bold text-foreground">
                  {log.durationMs} ms
                </div>
              </div>
            )}

            {log.requestId && (
              <div className="p-3 bg-background rounded-2xl border border-border space-y-1">
                <div className="flex items-center justify-between text-foreground-secondary text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" />
                    <span>Request ID</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(log.requestId!, 'req')}
                    className="hover:text-foreground"
                    title="Sao chép Request ID"
                  >
                    {copiedKey === 'req' ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="font-mono text-foreground truncate">
                  {log.requestId}
                </div>
              </div>
            )}

            {log.sessionId && (
              <div className="p-3 bg-background rounded-2xl border border-border space-y-1">
                <div className="flex items-center justify-between text-foreground-secondary text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Session ID</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(log.sessionId!, 'sess')}
                    className="hover:text-foreground"
                    title="Sao chép Session ID"
                  >
                    {copiedKey === 'sess' ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="font-mono text-foreground truncate">
                  {log.sessionId}
                </div>
              </div>
            )}
          </div>

          {/* Error Details */}
          {(log.errorName || log.errorMessage || log.errorStack) && (
            <div className="p-4 bg-destructive-muted/20 border border-destructive/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>{log.errorName || 'Error'}: {log.errorMessage}</span>
                </div>
                {log.errorStack && (
                  <button
                    onClick={() => copyToClipboard(log.errorStack!, 'stack')}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface border border-border text-foreground hover:bg-surface-hover text-[11px]"
                  >
                    {copiedKey === 'stack' ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                    <span>Sao chép Stack Trace</span>
                  </button>
                )}
              </div>

              {log.errorStack && (
                <pre className="p-3 bg-background rounded-xl font-mono text-[11px] text-destructive overflow-x-auto max-h-56 whitespace-pre-wrap border border-destructive/20">
                  {log.errorStack}
                </pre>
              )}
            </div>
          )}

          {/* Formatted Structured Metadata */}
          {formattedMetadata && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Code className="w-4 h-4 text-primary" />
                  <span>Dữ liệu có cấu trúc (Structured Metadata)</span>
                </div>

                <button
                  onClick={() => copyToClipboard(formattedMetadata, 'meta')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface border border-border text-foreground hover:bg-surface-hover text-[11px] font-medium transition-colors"
                >
                  {copiedKey === 'meta' ? (
                    <>
                      <Check className="w-3 h-3 text-success" />
                      <span className="text-success font-semibold">Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Sao chép JSON</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 bg-background border border-border rounded-2xl font-mono text-[11px] text-foreground overflow-x-auto max-h-72">
                {formattedMetadata}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 px-6 border-t border-border bg-surface flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 shadow-google-sm transition-all"
          >
            Đóng (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
