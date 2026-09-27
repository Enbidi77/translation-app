import { LogLevel, LogContext } from '../../shared/types/logging';

export class LoggerClient {
  private static instance: LoggerClient | null = null;
  private defaultContext: LogContext = { source: 'renderer' };

  public static getInstance(): LoggerClient {
    if (!LoggerClient.instance) {
      LoggerClient.instance = new LoggerClient();
    }
    return LoggerClient.instance;
  }

  private send(level: LogLevel, message: string, context?: LogContext): void {
    const merged: LogContext = {
      ...this.defaultContext,
      ...context,
      metadata: {
        ...(this.defaultContext.metadata || {}),
        ...(context?.metadata || {}),
      },
    };

    try {
      if (typeof window !== 'undefined' && window.electronAPI?.logger) {
        window.electronAPI.logger[level](message, merged);
      } else if (typeof window !== 'undefined' && window.electron?.logger) {
        window.electron.logger[level](message, merged);
      } else {
        // Fallback for tests or disconnected browser
        console[level === LogLevel.FATAL ? 'error' : level]?.(
          `[RENDERER:${level.toUpperCase()}] ${message}`,
          merged
        );
      }
    } catch (err) {
      console.warn('[LoggerClient] Failed to send log via IPC:', err);
    }
  }

  public trace(message: string, context?: LogContext): void {
    this.send(LogLevel.TRACE, message, context);
  }

  public debug(message: string, context?: LogContext): void {
    this.send(LogLevel.DEBUG, message, context);
  }

  public info(message: string, context?: LogContext): void {
    this.send(LogLevel.INFO, message, context);
  }

  public warn(message: string, context?: LogContext): void {
    this.send(LogLevel.WARN, message, context);
  }

  public error(message: string, context?: LogContext): void {
    this.send(LogLevel.ERROR, message, context);
  }

  public fatal(message: string, context?: LogContext): void {
    this.send(LogLevel.FATAL, message, context);
  }

  public async time<T>(
    operation: string,
    context: LogContext = {},
    fn: () => Promise<T> | T
  ): Promise<T> {
    const start = performance.now();
    try {
      const res = await fn();
      const durationMs = Math.round(performance.now() - start);
      this.info(`${operation} completed`, {
        ...context,
        durationMs,
        status: 'success',
        event: context.event || `${operation.toLowerCase().replace(/\s+/g, '_')}_time`,
      });
      return res;
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);
      this.error(`${operation} failed`, {
        ...context,
        durationMs,
        status: 'failed',
        error: err,
      });
      throw err;
    }
  }
}

export const logger = LoggerClient.getInstance();

/**
 * Setup unhandled error listeners in renderer
 */
export function setupRendererErrorHandlers(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    logger.error('Unhandled Renderer Error', {
      category: 'ui',
      source: 'renderer',
      event: 'window_error',
      error: event.error || event.message,
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled Promise Rejection in Renderer', {
      category: 'ui',
      source: 'renderer',
      event: 'unhandled_rejection',
      error: event.reason,
    });
  });
}
