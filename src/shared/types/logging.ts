export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export const LOG_SEVERITY: Record<LogLevel, number> = {
  [LogLevel.TRACE]: 10,
  [LogLevel.DEBUG]: 20,
  [LogLevel.INFO]: 30,
  [LogLevel.WARN]: 40,
  [LogLevel.ERROR]: 50,
  [LogLevel.FATAL]: 60,
};

export const LOG_LEVELS = [
  LogLevel.TRACE,
  LogLevel.DEBUG,
  LogLevel.INFO,
  LogLevel.WARN,
  LogLevel.ERROR,
  LogLevel.FATAL,
] as const;

export type LogCategory =
  | 'application'
  | 'database'
  | 'ipc'
  | 'ui'
  | 'ocr'
  | 'translation'
  | 'speech'
  | 'tts'
  | 'subtitle'
  | 'ai'
  | 'network'
  | 'authentication'
  | 'settings'
  | 'performance'
  | 'security'
  | 'system'
  | 'startup'
  | 'shutdown'
  | 'vocabulary'
  | 'flashcard'
  | string;

export type LogSource = 'main' | 'renderer' | 'preload' | 'worker' | 'ipc';

export type LogStatus = 'started' | 'success' | 'failed' | 'cancelled';

export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  code?: string | number;
}

export interface LogContext {
  category?: LogCategory;
  source?: LogSource;
  module?: string;
  event?: string;
  requestId?: string;
  sessionId?: string;
  userAction?: string;
  durationMs?: number;
  status?: LogStatus;
  metadata?: Record<string, unknown>;
  error?: unknown;
}

export interface LogItem {
  id: number;
  timestamp: number;
  level: LogLevel;
  severity: number;
  message: string;
  category: string | null;
  source: LogSource | null;
  module: string | null;
  event: string | null;
  requestId: string | null;
  sessionId: string | null;
  userAction: string | null;
  durationMs: number | null;
  status: string | null;
  errorName: string | null;
  errorMessage: string | null;
  errorStack: string | null;
  metadata: string | null; // JSON string
  createdAt: number;
}

export interface LogQueryFilter {
  search?: string;
  level?: LogLevel | LogLevel[];
  minSeverity?: number;
  category?: string | string[];
  source?: LogSource | LogSource[];
  module?: string;
  event?: string;
  requestId?: string;
  sessionId?: string;
  startTime?: number;
  endTime?: number;
  page?: number;
  limit?: number;
  sortOrder?: 'asc' | 'desc';
}

export interface LogQueryResult {
  items: LogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ErrorSummaryItem {
  errorName: string;
  module: string;
  event: string;
  count: number;
}

export interface SlowOperationItem {
  operation: string;
  durationMs: number;
  timestamp: number;
  category: string;
  module?: string;
  status?: string;
}

export interface LogStats {
  total: number;
  errorCount: number;
  warnCount: number;
  fatalCount: number;
  infoCount: number;
  debugCount: number;
  traceCount: number;
  avgDurationMs: number;
  topErrors: ErrorSummaryItem[];
  slowOperations: SlowOperationItem[];
}

export interface LoggingConfig {
  enabled: boolean;
  minLevel: LogLevel;
  retentionDays: number;
  maxDbSizeBytes: number;
  enableConsole: boolean;
  enablePerformance: boolean;
  enableAiMetadata: boolean;
  enableSpeechMetadata: boolean;
  enableOcrMetadata: boolean;
  developerMode: boolean;
  slowOperationThresholdMs: number;
}

export type LogExportFormat = 'json' | 'csv' | 'txt';

export interface LogExportOptions {
  format: LogExportFormat;
  filter?: LogQueryFilter;
}
