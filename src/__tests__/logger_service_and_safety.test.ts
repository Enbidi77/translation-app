import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DatabaseService } from '../database';
import { LoggerService } from '../main/logging/logger-service';
import { Logger } from '../main/logging/logger';
import { LogRepository } from '../main/logging/log-repository';
import { LogLevel } from '../shared/types/logging';
import { LogRotationService } from '../main/logging/log-rotation';

describe('LoggerService & Failure Safety', () => {
  const testDir = path.join(process.cwd(), 'tmp_test_logger_service_db');
  let repository: LogRepository;
  let service: LoggerService;

  beforeAll(async () => {
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
    await DatabaseService.getInstance().initialize(testDir);
    repository = new LogRepository();
    service = LoggerService.getInstance(repository);
    service.init({ enabled: true, minLevel: LogLevel.TRACE, enableConsole: false });
  });

  afterAll(async () => {
    await service.shutdown();
    DatabaseService.getInstance().close();
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  it('should immediately flush critical logs (ERROR / FATAL)', async () => {
    const logger = new Logger({ module: 'test-critical' }, service);

    logger.error('Critical database timeout', {
      category: 'database',
      event: 'db_timeout',
      error: new Error('Timeout connection'),
    });

    // Wait short tick for immediate flush promise to settle
    await new Promise((r) => setTimeout(r, 50));

    const result = await repository.query({ module: 'test-critical' });
    expect(result.total).toBe(1);
    expect(result.items[0].level).toBe('error');
    expect(result.items[0].errorMessage).toContain('Timeout connection');
  });

  it('should queue non-critical logs and flush on demand', async () => {
    const logger = new Logger({ module: 'test-queue' }, service);

    logger.info('User opened settings', { event: 'open_settings' });
    logger.debug('Loaded cached profile', { event: 'load_cache' });

    // Explicitly await flush
    await service.flush();

    const result = await repository.query({ module: 'test-queue' });
    expect(result.total).toBe(2);
  });

  it('should never crash the application when database operations fail', async () => {
    // Create a mock repository that always throws on insertBatch
    const brokenRepo = new LogRepository();
    vi.spyOn(brokenRepo, 'insertBatch').mockRejectedValue(new Error('Disk I/O Error: SQLite is locked'));

    const resilientService = LoggerService.createInstance(brokenRepo);
    resilientService.init({ enabled: true, minLevel: LogLevel.TRACE, enableConsole: false });
    const testLogger = new Logger({ module: 'resilience-test' }, resilientService);

    // Logging should NOT throw
    expect(() => {
      testLogger.error('This error should be preserved in fallback buffer', {
        category: 'system',
      });
    }).not.toThrow();

    await resilientService.flush();

    // Verify item was stored in fallback in-memory buffer
    const fallbackBuffer = resilientService.getFallbackBuffer();
    expect(fallbackBuffer.length).toBeGreaterThan(0);
    expect(fallbackBuffer.some((item) => item.message.includes('fallback buffer'))).toBe(true);
  });

  it('should measure execution time and log slow operations with logger.time()', async () => {
    service.updateConfig({ slowOperationThresholdMs: 50 }); // Set small threshold for test
    const logger = new Logger({ module: 'performance-test' }, service);

    const result = await logger.time(
      'Heavy OCR processing',
      { category: 'ocr' },
      async () => {
        await new Promise((r) => setTimeout(r, 70));
        return { blocksFound: 4 };
      }
    );

    expect(result.blocksFound).toBe(4);

    await service.flush();

    const logs = await repository.query({ module: 'performance-test' });
    expect(logs.total).toBeGreaterThanOrEqual(1);

    // There should be a WARN log for exceeding threshold (slow operation)
    const slowWarn = logs.items.find((l) => l.event === 'slow_operation');
    expect(slowWarn).toBeDefined();
    expect(slowWarn?.level).toBe('warn');
  });

  it('should create child loggers with merged context', async () => {
    const parent = new Logger({ source: 'main', category: 'translation' }, service);
    const child = parent.child({ module: 'chinese-engine', requestId: 'req_child_123' });

    child.info('Segmenting text input', { event: 'text_segmented' });
    await service.flush();

    const logs = await repository.query({ requestId: 'req_child_123' });
    expect(logs.total).toBe(1);
    expect(logs.items[0].category).toBe('translation');
    expect(logs.items[0].module).toBe('chinese-engine');
  });

  it('should run retention maintenance without deleting non-expired logs', async () => {
    const rotation = LogRotationService.getInstance(repository);
    const maintenanceResult = await rotation.runMaintenance({
      enabled: true,
      minLevel: LogLevel.INFO,
      retentionDays: 30, // 30 days
      maxDbSizeBytes: 100 * 1024 * 1024,
      enableConsole: false,
      enablePerformance: true,
      enableAiMetadata: true,
      enableSpeechMetadata: true,
      enableOcrMetadata: true,
      developerMode: false,
      slowOperationThresholdMs: 1000,
    });

    // Today's logs should not be deleted by 30 days retention
    expect(maintenanceResult.retentionDeleted).toBe(0);
  });
});
