import { LogRepository } from './log-repository';
import { LoggingConfig } from '../../shared/types/logging';

export class LogRotationService {
  private static instance: LogRotationService | null = null;
  private repository: LogRepository;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isCleaning = false;

  private constructor(repository?: LogRepository) {
    this.repository = repository || new LogRepository();
  }

  public static getInstance(repository?: LogRepository): LogRotationService {
    if (!LogRotationService.instance) {
      LogRotationService.instance = new LogRotationService(repository);
    }
    return LogRotationService.instance;
  }

  /**
   * Start scheduled maintenance timer (runs every 24 hours + immediately once)
   */
  public start(config: LoggingConfig): void {
    this.stop();

    // Run once on startup asynchronously
    setTimeout(() => {
      this.runMaintenance(config).catch((err) => {
        console.error('[LogRotation] Startup maintenance error:', err);
      });
    }, 5000);

    // Schedule 24h interval
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    this.cleanupTimer = setInterval(() => {
      this.runMaintenance(config).catch((err) => {
        console.error('[LogRotation] Periodic maintenance error:', err);
      });
    }, TWENTY_FOUR_HOURS_MS);
  }

  public stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Run retention cleanup and size-based pruning
   */
  public async runMaintenance(config: LoggingConfig): Promise<{
    retentionDeleted: number;
    sizePruned: number;
  }> {
    if (this.isCleaning) {
      return { retentionDeleted: 0, sizePruned: 0 };
    }

    this.isCleaning = true;
    let retentionDeleted = 0;
    let sizePruned = 0;

    try {
      // 1. Time-based retention
      if (config.retentionDays > 0) {
        const cutoffMs = Date.now() - config.retentionDays * 24 * 60 * 60 * 1000;
        const res = await this.repository.clear({ olderThanMs: cutoffMs });
        retentionDeleted = res.deletedCount;
      }

      // 2. Database size check
      const currentSize = this.repository.getDatabaseFileSize();
      const maxSizeBytes = config.maxDbSizeBytes || 100 * 1024 * 1024; // 100 MB default

      if (currentSize > maxSizeBytes * 0.9) {
        // Approaching 90% or above maximum size limit -> tiered pruning
        // Step A: Prune oldest trace & debug
        const prunedTraceDebug = await this.repository.pruneOldestByLevel(['trace', 'debug'], 1000);
        sizePruned += prunedTraceDebug;

        // Check if size is still near limit
        const sizeAfterTrace = this.repository.getDatabaseFileSize();
        if (sizeAfterTrace > maxSizeBytes * 0.85) {
          // Step B: Prune oldest info
          const prunedInfo = await this.repository.pruneOldestByLevel(['info'], 1000);
          sizePruned += prunedInfo;
        }

        const sizeAfterInfo = this.repository.getDatabaseFileSize();
        if (sizeAfterInfo > maxSizeBytes * 0.85) {
          // Step C: Prune oldest warn
          const prunedWarn = await this.repository.pruneOldestByLevel(['warn'], 500);
          sizePruned += prunedWarn;
        }
      }
    } catch (err) {
      console.error('[LogRotation] Maintenance failed:', err);
    } finally {
      this.isCleaning = false;
    }

    return { retentionDeleted, sizePruned };
  }
}
