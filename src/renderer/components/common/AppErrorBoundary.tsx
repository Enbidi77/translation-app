import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import { logger } from '../../services/logger-client';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    logger.error('React Component Error caught by AppErrorBoundary', {
      category: 'ui',
      source: 'renderer',
      module: 'AppErrorBoundary',
      event: 'react_render_error',
      error,
      metadata: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleReturnDashboard = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = '#/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] h-full p-8 text-center bg-background text-foreground select-none">
          <div className="max-w-md w-full bg-surface border border-border rounded-3xl p-8 shadow-google-lg space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive-muted text-destructive flex items-center justify-center border border-destructive/30">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Đã xảy ra sự cố</h2>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                Ứng dụng gặp lỗi không mong muốn trong khi hiển thị giao diện. Sự cố đã được tự động ghi lại vào nhật ký hệ thống để chuẩn đoán.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-2xl bg-primary text-primary-foreground hover:opacity-90 shadow-google-sm transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Thử lại (Retry)</span>
              </button>

              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-2xl border border-border bg-surface hover:bg-surface-hover text-foreground transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tải lại trang (Reload)</span>
              </button>

              <button
                onClick={this.handleReturnDashboard}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-2xl border border-border bg-surface hover:bg-surface-hover text-foreground transition-all"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Về trang chủ</span>
              </button>
            </div>

            {/* Expandable Technical Details */}
            <div className="pt-2 text-left border-t border-border">
              <button
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="flex items-center gap-1.5 text-[11px] text-foreground-secondary hover:text-foreground font-medium"
              >
                {this.state.showDetails ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <span>Chi tiết kỹ thuật (Dành cho nhà phát triển)</span>
              </button>

              {this.state.showDetails && (
                <div className="mt-3 p-3 bg-background rounded-xl border border-border text-[11px] font-mono text-destructive overflow-x-auto max-h-48 text-left select-text">
                  <div className="font-bold">{this.state.error?.name}: {this.state.error?.message}</div>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="mt-2 text-[10px] text-foreground-secondary whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
