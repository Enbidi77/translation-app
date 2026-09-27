import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DatabaseService } from '../database';
import { LogRepository } from '../main/logging/log-repository';
import { LogLevel, LOG_SEVERITY } from '../shared/types/logging';
import { NewLogRecord } from '../database/schema/logs';

describe('LogRepository with Drizzle ORM & SQLite', () => {
  const testDir = path.join(process.cwd(), 'tmp_test_logs_db');
  let repository: LogRepository;

  beforeAll(async () => {
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
    await DatabaseService.getInstance().initialize(testDir);
    repository = new LogRepository();
  });

  afterAll(() => {
    DatabaseService.getInstance().close();
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  it('should batch insert structured log entries via Drizzle', async () => {
    const now = Date.now();
    const batch: NewLogRecord[] = [
      {
        timestamp: now - 3000,
        level: LogLevel.INFO,
        severity: LOG_SEVERITY[LogLevel.INFO],
        message: 'Application started successfully',
        category: 'startup',
        source: 'main',
        module: 'main-process',
        event: 'app_start',
        requestId: 'req_start_1',
        sessionId: 'sess_1',
        createdAt: now - 3000,
      },
      {
        timestamp: now - 2000,
        level: LogLevel.WARN,
        severity: LOG_SEVERITY[LogLevel.WARN],
        message: 'Provider retry due to rate limit',
        category: 'network',
        source: 'main',
        module: 'ai-provider',
        event: 'provider_retry',
        durationMs: 820,
        requestId: 'req_ai_1',
        sessionId: 'sess_1',
        createdAt: now - 2000,
      },
      {
        timestamp: now - 1000,
        level: LogLevel.ERROR,
        severity: LOG_SEVERITY[LogLevel.ERROR],
        message: 'Translation request failed',
        category: 'translation',
        source: 'main',
        module: 'translation-service',
        event: 'translation_failed',
        errorName: 'NetworkError',
        errorMessage: 'Connection timed out to provider',
        errorStack: 'NetworkError: Connection timed out\n  at callApi()',
        durationMs: 1450,
        requestId: 'req_trans_1',
        sessionId: 'sess_1',
        createdAt: now - 1000,
      },
    ];

    await repository.insertBatch(batch);

    const result = await repository.query({ limit: 10 });
    expect(result.total).toBe(3);
    expect(result.items.length).toBe(3);
    expect(result.items[0].message).toBe('Translation request failed'); // Most recent first
  });

  it('should filter logs by level, category, and text search', async () => {
    const errorResult = await repository.query({ level: LogLevel.ERROR });
    expect(errorResult.total).toBe(1);
    expect(errorResult.items[0].errorName).toBe('NetworkError');

    const startupResult = await repository.query({ category: 'startup' });
    expect(startupResult.total).toBe(1);
    expect(startupResult.items[0].event).toBe('app_start');

    const searchResult = await repository.query({ search: 'timed out' });
    expect(searchResult.total).toBe(1);
    expect(searchResult.items[0].errorMessage).toContain('Connection timed out');
  });

  it('should handle pagination correctly (limit, page, totalPages)', async () => {
    const page1 = await repository.query({ page: 1, limit: 2 });
    expect(page1.items.length).toBe(2);
    expect(page1.total).toBe(3);
    expect(page1.totalPages).toBe(2);

    const page2 = await repository.query({ page: 2, limit: 2 });
    expect(page2.items.length).toBe(1);
  });

  it('should compute aggregated log statistics and top errors', async () => {
    const stats = await repository.getStats();

    expect(stats.total).toBe(3);
    expect(stats.errorCount).toBe(1);
    expect(stats.warnCount).toBe(1);
    expect(stats.fatalCount).toBe(0);
    expect(stats.infoCount).toBe(1);
    expect(stats.avgDurationMs).toBeGreaterThan(0);

    // Top errors
    expect(stats.topErrors.length).toBe(1);
    expect(stats.topErrors[0].errorName).toBe('NetworkError');
    expect(stats.topErrors[0].count).toBe(1);

    // Slow operations (>= 500ms)
    expect(stats.slowOperations.length).toBeGreaterThanOrEqual(1);
  });

  it('should clear logs and prune by level', async () => {
    const now = Date.now();
    // Clear logs older than now - 1500ms (should remove the first 2 logs)
    const partialClear = await repository.clear({ olderThanMs: now - 1500 });
    expect(partialClear.deletedCount).toBe(2);

    const remaining = await repository.query({});
    expect(remaining.total).toBe(1);

    // Clear all
    const allClear = await repository.clear();
    expect(allClear.deletedCount).toBe(1);

    const empty = await repository.query({});
    expect(empty.total).toBe(0);
  });
});
