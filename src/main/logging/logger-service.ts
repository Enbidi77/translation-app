import fs from 'fs';
import path from 'path';
import { BrowserWindow } from 'electron';
import { NewLogRecord } from '../../database/schema/logs';
import {
  LogLevel,
  LOG_SEVERITY,
  LogContext,
  LogItem,
  LoggingConfig,
} from '../../shared/types/logging';
import { IPC_CHANNELS } from '../../shared/constants/ipc';
import { sanitizeMetadata, sanitizeString } from './log-sanitizer';
import { serializeError, getSessionId } from './log-context';
import { LogRepository } from './log-repository';
import { LogRotationService } from './log-rotation';

export class LoggerService {
  private static instance: LoggerService | null = null;
  private repository: LogRepository;
  private queue: NewLogRecord[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isFlushing = false;
  private isProcessingError = false;

  // Fallback in-memory ring buffer (up to 200 items) if SQLite writes fail
  private fallbackBuffer: LogItem[] = [];
  private readonly maxFallbackCapacity = 200;

  // Circuit breaker state for DB failures
  private consecutiveDbFailures = 0;
  private dbFailureCooldownUntil = 0;

  // Live listeners for new log events (e.g. for testing or in-process inspection)
  private liveListeners: Set<(item: LogItem) => void> = new Set();

  private config: LoggingConfig = {
    enabled: true,
    minLevel: LogLevel.INFO,
    retentionDays: 30,
    maxDbSizeBytes: 100 * 1024 * 1024,
    enableConsole: true,
    enablePerformance: true,
    enableAiMetadata: true,
    enableSpeechMetadata: true,
    enableOcrMetadata: true,
    developerMode: false,
    slowOperationThresholdMs: 1000,
  };

  private constructor(repository?: LogRepository) {
    this.repository = repository || new LogRepository();
    // Default minLevel to DEBUG in development mode
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      this.config.minLevel = LogLevel.DEBUG;
    }
  }

  public static getInstance(repository?: LogRepository): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService(repository);
    }
    return LoggerService.instance;
  }

  public static createInstance(repository?: LogRepository): LoggerService {
    return new LoggerService(repository);
  }

  public setRepository(repo: LogRepository): void {
    this.repository = repo;
  }

  public init(config?: Partial<LoggingConfig>): void {
    if (config) {
      this.updateConfig(config);
    }
    // Start rotation service with current config
    LogRotationService.getInstance(this.repository).start(this.config);
  }

  public getConfig(): LoggingConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // If developerMode was enabled, allow DEBUG logs
    if (this.config.developerMode && LOG_SEVERITY[this.config.minLevel] > LOG_SEVERITY[LogLevel.DEBUG]) {
      this.config.minLevel = LogLevel.DEBUG;
    }
  }

  public addLiveListener(listener: (item: LogItem) => void): () => void {
    this.liveListeners.add(listener);
    return () => this.liveListeners.delete(listener);
  }

  /**
   * Primary log recording method
   */
  public log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.config.enabled) return;

    const severity = LOG_SEVERITY[level] || 30;
    const minSeverity = LOG_SEVERITY[this.config.minLevel] || 30;

    // Filter out logs below minimum severity
    if (severity < minSeverity) return;

    try {
      const now = Date.now();
      const sanitizedMessage = sanitizeString(message);

      // Extract error details if present
      let errorName: string | null = null;
      let errorMessage: string | null = null;
      let errorStack: string | null = null;

      if (context?.error) {
        const serialized = serializeError(context.error);
        errorName = serialized.name;
        errorMessage = serialized.message;
        errorStack = serialized.stack || null;
      }

      // Sanitize metadata
      let metadataJson: string | null = null;
      if (context?.metadata) {
        const sanitizedMeta = sanitizeMetadata(context.metadata);
        try {
          metadataJson = JSON.stringify(sanitizedMeta);
        } catch {
          metadataJson = JSON.stringify({ error: '[METADATA_SERIALIZATION_FAILED]' });
        }
      }

      const record: NewLogRecord = {
        timestamp: now,
        level,
        severity,
        message: sanitizedMessage,
        category: context?.category || 'application',
        source: context?.source || 'main',
        module: context?.module || null,
        event: context?.event || null,
        requestId: context?.requestId || null,
        sessionId: context?.sessionId || getSessionId(),
        userAction: context?.userAction || null,
        durationMs: context?.durationMs !== undefined ? Math.round(context.durationMs) : null,
        status: context?.status || null,
        errorName,
        errorMessage,
        errorStack,
        metadata: metadataJson,
        createdAt: now,
      };

      // In development or when console logging is enabled, output nicely to console
      if (this.config.enableConsole) {
        this.writeToConsole(record);
      }

      // Realtime notification to renderer windows & local listeners
      this.broadcastLogItem(record);

      // Enqueue for batch writing
      this.enqueue(record, level === LogLevel.ERROR || level === LogLevel.FATAL);
    } catch (err) {
      // Logger failures must NEVER crash the application
      if (!this.isProcessingError) {
        this.isProcessingError = true;
        console.error('[LoggerService] Internal failure in log():', err);
        this.isProcessingError = false;
      }
    }
  }

  private writeToConsole(record: NewLogRecord): void {
    const timeStr = new Date(record.timestamp).toLocaleTimeString();
    const tag = `[${record.category || 'app'}${record.module ? `:${record.module}` : ''}]`;
    const dur = record.durationMs !== null && record.durationMs !== undefined ? ` (${record.durationMs}ms)` : '';
    const formatted = `${timeStr} ${record.level.toUpperCase()} ${tag} ${record.message}${dur}`;

    switch (record.level) {
      case LogLevel.FATAL:
      case LogLevel.ERROR:
        console.error(formatted, record.errorMessage || '', record.metadata || '');
        break;
      case LogLevel.WARN:
        console.warn(formatted, record.metadata || '');
        break;
      case LogLevel.DEBUG:
      case LogLevel.TRACE:
        console.debug(formatted, record.metadata || '');
        break;
      default:
        console.log(formatted);
        break;
    }
  }

  private broadcastLogItem(record: NewLogRecord): void {
    const item: LogItem = {
      id: -Date.now(), // Temporary id until committed
      timestamp: record.timestamp,
      level: record.level as LogLevel,
      severity: record.severity,
      message: record.message,
      category: record.category || null,
      source: record.source as any,
      module: record.module || null,
      event: record.event || null,
      requestId: record.requestId || null,
      sessionId: record.sessionId || null,
      userAction: record.userAction || null,
      durationMs: record.durationMs || null,
      status: record.status || null,
      errorName: record.errorName || null,
      errorMessage: record.errorMessage || null,
      errorStack: record.errorStack || null,
      metadata: record.metadata || null,
      createdAt: record.createdAt,
    };

    // Notify in-process listeners
    for (const listener of this.liveListeners) {
      try {
        listener(item);
      } catch {}
    }

    // Broadcast to Electron windows if any are open
    try {
      if (typeof BrowserWindow !== 'undefined') {
        const windows = BrowserWindow.getAllWindows();
        for (const win of windows) {
          if (!win.isDestroyed() && win.webContents) {
            win.webContents.send(IPC_CHANNELS.EVENT_LOG_NEW, item);
          }
        }
      }
    } catch {
      // Ignore if Electron BrowserWindow is unavailable (e.g. during headless unit tests)
    }
  }

  /**
   * Enqueue log for asynchronous batch write
   */
  private enqueue(record: NewLogRecord, isCritical: boolean): void {
    this.queue.push(record);

    // If critical (ERROR/FATAL), flush immediately
    if (isCritical) {
      this.flushSyncSafely();
      return;
    }

    // If queue reaches 50 entries, flush immediately
    if (this.queue.length >= 50) {
      this.flushSyncSafely();
      return;
    }

    // Otherwise flush within 500ms
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flushTimer = null;
        this.flushSyncSafely();
      }, 500);
    }
  }

  private flushSyncSafely(): void {
    this.flush().catch((err) => {
      if (!this.isProcessingError) {
        this.isProcessingError = true;
        console.error('[LoggerService] Flush async error:', err);
        this.isProcessingError = false;
      }
    });
  }

  /**
   * Persist queued logs to SQLite
   */
  public async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) return;

    // Check circuit breaker
    if (Date.now() < this.dbFailureCooldownUntil) {
      // Store in memory fallback buffer instead of dropping
      this.storeInFallbackBuffer(this.queue.splice(0, this.queue.length));
      return;
    }

    this.isFlushing = true;
    const batch = this.queue.splice(0, this.queue.length);

    try {
      await this.repository.insertBatch(batch);
      this.consecutiveDbFailures = 0;

      // If we have items in fallback buffer and DB is healthy, attempt to drain them
      if (this.fallbackBuffer.length > 0) {
        await this.drainFallbackBuffer();
      }
    } catch (err) {
      this.consecutiveDbFailures++;
      // Backoff if failing repeatedly (cooldown for 5 seconds)
      if (this.consecutiveDbFailures >= 3) {
        this.dbFailureCooldownUntil = Date.now() + 5000;
        console.warn(
          `[LoggerService] SQLite write failed ${this.consecutiveDbFailures} times. Cooldown for 5s.`
        );
      }

      // Store in fallback buffer so logs aren't lost
      this.storeInFallbackBuffer(batch);

      // Write critical logs to a fallback file if available
      this.writeToFallbackFile(batch);
    } finally {
      this.isFlushing = false;
    }
  }

  private storeInFallbackBuffer(records: NewLogRecord[]): void {
    for (const r of records) {
      if (this.fallbackBuffer.length >= this.maxFallbackCapacity) {
        this.fallbackBuffer.shift(); // Evict oldest
      }
      this.fallbackBuffer.push({
        id: -Date.now(),
        timestamp: r.timestamp,
        level: r.level as LogLevel,
        severity: r.severity,
        message: r.message,
        category: r.category || null,
        source: r.source as any,
        module: r.module || null,
        event: r.event || null,
        requestId: r.requestId || null,
        sessionId: r.sessionId || null,
        userAction: r.userAction || null,
        durationMs: r.durationMs || null,
        status: r.status || null,
        errorName: r.errorName || null,
        errorMessage: r.errorMessage || null,
        errorStack: r.errorStack || null,
        metadata: r.metadata || null,
        createdAt: r.createdAt,
      });
    }
  }

  private async drainFallbackBuffer(): Promise<void> {
    if (!this.fallbackBuffer.length) return;
    try {
      const recordsToDrain: NewLogRecord[] = this.fallbackBuffer.map((item) => ({
        timestamp: item.timestamp,
        level: item.level,
        severity: item.severity,
        message: item.message,
        category: item.category,
        source: item.source,
        module: item.module,
        event: item.event,
        requestId: item.requestId,
        sessionId: item.sessionId,
        userAction: item.userAction,
        durationMs: item.durationMs,
        status: item.status,
        errorName: item.errorName,
        errorMessage: item.errorMessage,
        errorStack: item.errorStack,
        metadata: item.metadata,
        createdAt: item.createdAt,
      }));

      this.fallbackBuffer = [];
      await this.repository.insertBatch(recordsToDrain);
    } catch {
      // Ignore drain failures; records stay in memory or are re-queued
    }
  }

  private writeToFallbackFile(records: NewLogRecord[]): void {
    try {
      const criticalRecords = records.filter(
        (r) => r.level === LogLevel.ERROR || r.level === LogLevel.FATAL
      );
      if (!criticalRecords.length) return;

      const fallbackPath = path.join(process.cwd(), 'logs-critical-fallback.log');
      const lines = criticalRecords
        .map(
          (r) =>
            `[${new Date(r.timestamp).toISOString()}] [${r.level.toUpperCase()}] [${r.category}] ${r.message} ${r.errorMessage || ''}`
        )
        .join('\n');
      fs.appendFileSync(fallbackPath, lines + '\n');
    } catch {
      // Cannot write to fallback file; fail silently
    }
  }

  public getFallbackBuffer(): LogItem[] {
    return [...this.fallbackBuffer];
  }

  /**
   * Helper for performance timing
   */
  public async time<T>(
    operation: string,
    context: LogContext = {},
    fn: () => Promise<T> | T
  ): Promise<T> {
    const start = Date.now();
    const eventName = context.event || `${operation.toLowerCase().replace(/\s+/g, '_')}_time`;

    try {
      const result = await fn();
      const durationMs = Date.now() - start;

      // Log success
      this.log(LogLevel.INFO, `${operation} completed`, {
        ...context,
        durationMs,
        status: 'success',
        event: eventName,
      });

      // Check slow operation threshold
      const threshold = this.config.slowOperationThresholdMs || 1000;
      if (durationMs >= threshold) {
        this.log(LogLevel.WARN, `Slow operation detected: ${operation} (${durationMs}ms)`, {
          ...context,
          category: 'performance',
          event: 'slow_operation',
          durationMs,
          metadata: {
            operation,
            thresholdMs: threshold,
            ...(context.metadata || {}),
          },
        });
      }

      return result;
    } catch (error) {
      const durationMs = Date.now() - start;
      this.log(LogLevel.ERROR, `${operation} failed`, {
        ...context,
        durationMs,
        status: 'failed',
        event: `${eventName}_failed`,
        error,
      });
      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    LogRotationService.getInstance(this.repository).stop();
    await this.flush();
  }
}
