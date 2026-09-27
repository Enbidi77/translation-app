import { ipcMain } from 'electron';
import { z } from 'zod';
import { IPC_CHANNELS } from '../../shared/constants/ipc';
import { LogLevel, LogExportFormat } from '../../shared/types/logging';
import { LoggerService } from '../logging/logger-service';
import { LogRepository } from '../logging/log-repository';
import { sanitizeMetadata, sanitizeString } from '../logging/log-sanitizer';

// Zod Schemas for validation
const LogCreateSchema = z.object({
  level: z.nativeEnum(LogLevel).default(LogLevel.INFO),
  message: z.string().min(1).max(5000),
  category: z.string().optional(),
  source: z.enum(['main', 'renderer', 'preload', 'worker', 'ipc']).default('renderer'),
  module: z.string().optional(),
  event: z.string().optional(),
  requestId: z.string().optional(),
  sessionId: z.string().optional(),
  userAction: z.string().optional(),
  durationMs: z.number().optional(),
  status: z.enum(['started', 'success', 'failed', 'cancelled']).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  error: z.unknown().optional(),
});

const LogFilterSchema = z.object({
  search: z.string().optional(),
  level: z.union([z.nativeEnum(LogLevel), z.array(z.nativeEnum(LogLevel))]).optional(),
  minSeverity: z.number().optional(),
  category: z.union([z.string(), z.array(z.string())]).optional(),
  source: z.union([
    z.enum(['main', 'renderer', 'preload', 'worker', 'ipc']),
    z.array(z.enum(['main', 'renderer', 'preload', 'worker', 'ipc'])),
  ]).optional(),
  module: z.string().optional(),
  event: z.string().optional(),
  requestId: z.string().optional(),
  sessionId: z.string().optional(),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(500).default(50),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const LogExportSchema = z.object({
  format: z.enum(['json', 'csv', 'txt']).default('json'),
  filter: LogFilterSchema.optional(),
});

export function registerLogIpcHandlers(): void {
  const loggerService = LoggerService.getInstance();
  const repository = new LogRepository();

  // logs:create
  ipcMain.handle(IPC_CHANNELS.LOGS_CREATE, async (_, payload: unknown) => {
    try {
      const parsed = LogCreateSchema.parse(payload);
      loggerService.log(parsed.level, parsed.message, {
        category: parsed.category,
        source: parsed.source,
        module: parsed.module,
        event: parsed.event,
        requestId: parsed.requestId,
        sessionId: parsed.sessionId,
        userAction: parsed.userAction,
        durationMs: parsed.durationMs,
        status: parsed.status,
        metadata: parsed.metadata,
        error: parsed.error,
      });
      return { success: true };
    } catch (err: any) {
      console.error('[IPC:logs:create] Validation or execution error:', err);
      return { success: false, error: err.message };
    }
  });

  // logs:list
  ipcMain.handle(IPC_CHANNELS.LOGS_LIST, async (_, filterPayload: unknown) => {
    try {
      const filter = LogFilterSchema.parse(filterPayload || {});
      return await repository.query(filter);
    } catch (err: any) {
      console.error('[IPC:logs:list] Query error:', err);
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 1,
        error: err.message,
      };
    }
  });

  // logs:get
  ipcMain.handle(IPC_CHANNELS.LOGS_GET, async (_, id: number) => {
    try {
      return await repository.getById(id);
    } catch (err: any) {
      console.error('[IPC:logs:get] Error:', err);
      return null;
    }
  });

  // logs:count
  ipcMain.handle(IPC_CHANNELS.LOGS_COUNT, async (_, filterPayload: unknown) => {
    try {
      const filter = LogFilterSchema.parse(filterPayload || {});
      const result = await repository.query({ ...filter, limit: 1 });
      return result.total;
    } catch (err: any) {
      console.error('[IPC:logs:count] Error:', err);
      return 0;
    }
  });

  // logs:stats
  ipcMain.handle(IPC_CHANNELS.LOGS_STATS, async (_, timeRange?: { start?: number; end?: number }) => {
    try {
      return await repository.getStats(timeRange);
    } catch (err: any) {
      console.error('[IPC:logs:stats] Error:', err);
      return {
        total: 0,
        errorCount: 0,
        warnCount: 0,
        fatalCount: 0,
        infoCount: 0,
        debugCount: 0,
        traceCount: 0,
        avgDurationMs: 0,
        topErrors: [],
        slowOperations: [],
      };
    }
  });

  // logs:clear
  ipcMain.handle(IPC_CHANNELS.LOGS_CLEAR, async (_, options?: { olderThanMs?: number }) => {
    try {
      return await repository.clear(options);
    } catch (err: any) {
      console.error('[IPC:logs:clear] Error:', err);
      return { deletedCount: 0, error: err.message };
    }
  });

  // logs:deleteOlderThan
  ipcMain.handle(IPC_CHANNELS.LOGS_DELETE_OLDER_THAN, async (_, days: number) => {
    try {
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      return await repository.clear({ olderThanMs: cutoff });
    } catch (err: any) {
      console.error('[IPC:logs:deleteOlderThan] Error:', err);
      return { deletedCount: 0, error: err.message };
    }
  });

  // logs:export
  ipcMain.handle(IPC_CHANNELS.LOGS_EXPORT, async (_, optionsPayload: unknown) => {
    try {
      const options = LogExportSchema.parse(optionsPayload || {});
      // Fetch matching logs without pagination limit (capped at 5000 for export safety)
      const queryResult = await repository.query({
        ...(options.filter || {}),
        limit: 5000,
        page: 1,
      });

      const sanitizedItems = queryResult.items.map((item) => {
        let meta: any = null;
        if (item.metadata) {
          try {
            meta = sanitizeMetadata(JSON.parse(item.metadata));
          } catch {
            meta = item.metadata;
          }
        }
        return {
          id: item.id,
          timestamp: new Date(item.timestamp).toISOString(),
          level: item.level.toUpperCase(),
          category: item.category,
          source: item.source,
          module: item.module,
          event: item.event,
          message: sanitizeString(item.message),
          requestId: item.requestId,
          sessionId: item.sessionId,
          durationMs: item.durationMs,
          status: item.status,
          errorName: item.errorName,
          errorMessage: item.errorMessage ? sanitizeString(item.errorMessage) : null,
          metadata: meta,
        };
      });

      if (options.format === 'csv') {
        const headers = [
          'timestamp',
          'level',
          'category',
          'source',
          'module',
          'event',
          'message',
          'durationMs',
          'errorName',
          'errorMessage',
        ];
        const rows = sanitizedItems.map((item) =>
          headers
            .map((h) => {
              const val = (item as any)[h];
              if (val === null || val === undefined) return '""';
              const escaped = String(val).replace(/"/g, '""');
              return `"${escaped}"`;
            })
            .join(',')
        );
        return {
          format: 'csv',
          content: [headers.join(','), ...rows].join('\n'),
          count: sanitizedItems.length,
        };
      }

      if (options.format === 'txt') {
        const lines = sanitizedItems.map(
          (item) =>
            `[${item.timestamp}] [${item.level}] [${item.category || 'app'}${
              item.module ? `:${item.module}` : ''
            }] ${item.message}${item.durationMs ? ` (${item.durationMs}ms)` : ''}${
              item.errorMessage ? ` | ERROR: ${item.errorName}: ${item.errorMessage}` : ''
            }`
        );
        return {
          format: 'txt',
          content: lines.join('\n'),
          count: sanitizedItems.length,
        };
      }

      // Default JSON format
      return {
        format: 'json',
        content: JSON.stringify(sanitizedItems, null, 2),
        count: sanitizedItems.length,
      };
    } catch (err: any) {
      console.error('[IPC:logs:export] Error:', err);
      return { format: 'json', content: '[]', count: 0, error: err.message };
    }
  });

  // logs:getConfig
  ipcMain.handle(IPC_CHANNELS.LOGS_GET_CONFIG, async () => {
    return loggerService.getConfig();
  });

  // logs:updateConfig
  ipcMain.handle(IPC_CHANNELS.LOGS_UPDATE_CONFIG, async (_, newConfig: unknown) => {
    try {
      loggerService.updateConfig(newConfig as any);
      return { success: true, config: loggerService.getConfig() };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });
}
