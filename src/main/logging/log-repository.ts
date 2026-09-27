import fs from 'fs';
import { desc, asc, and, gte, lte, eq, inArray, like, or, sql } from 'drizzle-orm';
import { DatabaseService } from '../../database';
import { logs, NewLogRecord, LogRecord } from '../../database/schema/logs';
import {
  LogItem,
  LogLevel,
  LogQueryFilter,
  LogQueryResult,
  LogStats,
  ErrorSummaryItem,
  SlowOperationItem,
} from '../../shared/types/logging';

export class LogRepository {
  private get dbService() {
    return DatabaseService.getInstance();
  }

  private get drizzle() {
    return this.dbService.getDrizzle();
  }

  /**
   * Batch insert log entries using Drizzle ORM
   */
  public async insertBatch(entries: NewLogRecord[]): Promise<void> {
    if (!entries.length) return;

    try {
      await this.drizzle.insert(logs).values(entries);
      this.dbService.scheduleSave();
    } catch (err) {
      console.error('[LogRepository] Failed to insert batch into SQLite:', err);
      throw err;
    }
  }

  /**
   * Build Drizzle WHERE condition from filter
   */
  private buildWhereConditions(filter: LogQueryFilter) {
    const conditions: any[] = [];

    if (filter.level) {
      if (Array.isArray(filter.level)) {
        conditions.push(inArray(logs.level, filter.level));
      } else {
        conditions.push(eq(logs.level, filter.level));
      }
    }

    if (filter.minSeverity !== undefined) {
      conditions.push(gte(logs.severity, filter.minSeverity));
    }

    if (filter.category) {
      if (Array.isArray(filter.category)) {
        conditions.push(inArray(logs.category, filter.category));
      } else {
        conditions.push(eq(logs.category, filter.category));
      }
    }

    if (filter.source) {
      if (Array.isArray(filter.source)) {
        conditions.push(inArray(logs.source, filter.source));
      } else {
        conditions.push(eq(logs.source, filter.source));
      }
    }

    if (filter.module) {
      conditions.push(eq(logs.module, filter.module));
    }

    if (filter.event) {
      conditions.push(eq(logs.event, filter.event));
    }

    if (filter.requestId) {
      conditions.push(eq(logs.requestId, filter.requestId));
    }

    if (filter.sessionId) {
      conditions.push(eq(logs.sessionId, filter.sessionId));
    }

    if (filter.startTime !== undefined) {
      conditions.push(gte(logs.timestamp, filter.startTime));
    }

    if (filter.endTime !== undefined) {
      conditions.push(lte(logs.timestamp, filter.endTime));
    }

    if (filter.search && filter.search.trim()) {
      const term = `%${filter.search.trim()}%`;
      conditions.push(
        or(
          like(logs.message, term),
          like(logs.module, term),
          like(logs.event, term),
          like(logs.category, term),
          like(logs.source, term),
          like(logs.requestId, term),
          like(logs.sessionId, term),
          like(logs.errorMessage, term)
        )
      );
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  /**
   * Query logs with pagination, filtering and sorting
   */
  public async query(filter: LogQueryFilter = {}): Promise<LogQueryResult> {
    try {
      const limit = Math.min(Math.max(filter.limit || 50, 1), 500);
      const page = Math.max(filter.page || 1, 1);
      const offset = (page - 1) * limit;
      const sortOrder = filter.sortOrder === 'asc' ? asc(logs.timestamp) : desc(logs.timestamp);

      const whereClause = this.buildWhereConditions(filter);

      // Execute items query
      const items = await this.drizzle
        .select()
        .from(logs)
        .where(whereClause)
        .orderBy(sortOrder)
        .limit(limit)
        .offset(offset);

      // Execute count query
      const countResult = await this.drizzle
        .select({ count: sql<number>`count(*)` })
        .from(logs)
        .where(whereClause);

      const total = Number(countResult[0]?.count || 0);
      const totalPages = Math.ceil(total / limit) || 1;

      return {
        items: items.map(this.mapRecordToItem),
        total,
        page,
        limit,
        totalPages,
      };
    } catch (err) {
      console.error('[LogRepository] Query failed:', err);
      return {
        items: [],
        total: 0,
        page: 1,
        limit: filter.limit || 50,
        totalPages: 1,
      };
    }
  }

  /**
   * Get single log by ID
   */
  public async getById(id: number): Promise<LogItem | null> {
    try {
      const records = await this.drizzle
        .select()
        .from(logs)
        .where(eq(logs.id, id))
        .limit(1);

      return records.length > 0 ? this.mapRecordToItem(records[0]) : null;
    } catch (err) {
      console.error('[LogRepository] getById failed:', err);
      return null;
    }
  }

  /**
   * Get overall log statistics, top errors, and slow operations
   */
  public async getStats(timeRange?: { start?: number; end?: number }): Promise<LogStats> {
    try {
      const conditions: any[] = [];
      if (timeRange?.start !== undefined) conditions.push(gte(logs.timestamp, timeRange.start));
      if (timeRange?.end !== undefined) conditions.push(lte(logs.timestamp, timeRange.end));
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Aggregations
      const counts = await this.drizzle
        .select({
          total: sql<number>`count(*)`,
          errorCount: sql<number>`sum(case when ${logs.level} = 'error' then 1 else 0 end)`,
          warnCount: sql<number>`sum(case when ${logs.level} = 'warn' then 1 else 0 end)`,
          fatalCount: sql<number>`sum(case when ${logs.level} = 'fatal' then 1 else 0 end)`,
          infoCount: sql<number>`sum(case when ${logs.level} = 'info' then 1 else 0 end)`,
          debugCount: sql<number>`sum(case when ${logs.level} = 'debug' then 1 else 0 end)`,
          traceCount: sql<number>`sum(case when ${logs.level} = 'trace' then 1 else 0 end)`,
          avgDuration: sql<number>`avg(case when ${logs.durationMs} > 0 then ${logs.durationMs} else null end)`,
        })
        .from(logs)
        .where(whereClause);

      const agg = counts[0] || {
        total: 0,
        errorCount: 0,
        warnCount: 0,
        fatalCount: 0,
        infoCount: 0,
        debugCount: 0,
        traceCount: 0,
        avgDuration: 0,
      };

      // Top errors grouped by errorName, module, event
      const topErrorsRaw = await this.drizzle
        .select({
          errorName: sql<string>`coalesce(${logs.errorName}, 'UnknownError')`,
          module: sql<string>`coalesce(${logs.module}, 'unknown')`,
          event: sql<string>`coalesce(${logs.event}, 'error')`,
          count: sql<number>`count(*)`,
        })
        .from(logs)
        .where(
          and(
            whereClause,
            or(eq(logs.level, 'error'), eq(logs.level, 'fatal'))
          )
        )
        .groupBy(sql`coalesce(${logs.errorName}, 'UnknownError')`, sql`coalesce(${logs.module}, 'unknown')`, sql`coalesce(${logs.event}, 'error')`)
        .orderBy(desc(sql`count(*)`))
        .limit(10);

      const topErrors: ErrorSummaryItem[] = topErrorsRaw.map((r) => ({
        errorName: String(r.errorName),
        module: String(r.module),
        event: String(r.event),
        count: Number(r.count),
      }));

      // Slow operations (durationMs >= 500ms or category = 'performance')
      const slowOpsRaw = await this.drizzle
        .select()
        .from(logs)
        .where(
          and(
            whereClause,
            gte(logs.durationMs, 500)
          )
        )
        .orderBy(desc(logs.durationMs))
        .limit(10);

      const slowOperations: SlowOperationItem[] = slowOpsRaw.map((r) => ({
        operation: r.event || r.message,
        durationMs: r.durationMs || 0,
        timestamp: r.timestamp,
        category: r.category || 'performance',
        module: r.module || undefined,
        status: r.status || undefined,
      }));

      return {
        total: Number(agg.total || 0),
        errorCount: Number(agg.errorCount || 0),
        warnCount: Number(agg.warnCount || 0),
        fatalCount: Number(agg.fatalCount || 0),
        infoCount: Number(agg.infoCount || 0),
        debugCount: Number(agg.debugCount || 0),
        traceCount: Number(agg.traceCount || 0),
        avgDurationMs: Math.round(Number(agg.avgDuration || 0)),
        topErrors,
        slowOperations,
      };
    } catch (err) {
      console.error('[LogRepository] getStats failed:', err);
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
  }

  /**
   * Delete logs matching criteria
   */
  public async clear(filter?: { olderThanMs?: number }): Promise<{ deletedCount: number }> {
    try {
      let count = 0;
      if (filter?.olderThanMs !== undefined) {
        const toDelete = await this.drizzle
          .select({ count: sql<number>`count(*)` })
          .from(logs)
          .where(lte(logs.timestamp, filter.olderThanMs));
        count = Number(toDelete[0]?.count || 0);

        await this.drizzle.delete(logs).where(lte(logs.timestamp, filter.olderThanMs));
      } else {
        const toDelete = await this.drizzle.select({ count: sql<number>`count(*)` }).from(logs);
        count = Number(toDelete[0]?.count || 0);

        await this.drizzle.delete(logs);
      }

      this.dbService.scheduleSave();
      return { deletedCount: count };
    } catch (err) {
      console.error('[LogRepository] Clear failed:', err);
      return { deletedCount: 0 };
    }
  }

  /**
   * Delete oldest logs of specified levels to reduce database size
   */
  public async pruneOldestByLevel(levels: string[], limit: number): Promise<number> {
    if (!levels.length || limit <= 0) return 0;
    try {
      const rows = await this.drizzle
        .select({ id: logs.id })
        .from(logs)
        .where(inArray(logs.level, levels))
        .orderBy(asc(logs.timestamp))
        .limit(limit);

      if (!rows.length) return 0;

      const ids = rows.map((r) => r.id);
      await this.drizzle.delete(logs).where(inArray(logs.id, ids));
      this.dbService.scheduleSave();
      return ids.length;
    } catch (err) {
      console.error('[LogRepository] pruneOldestByLevel failed:', err);
      return 0;
    }
  }

  /**
   * Get approximate database file size in bytes
   */
  public getDatabaseFileSize(): number {
    try {
      const dbPath = this.dbService.getDbPath();
      if (dbPath && fs.existsSync(dbPath)) {
        return fs.statSync(dbPath).size;
      }
    } catch {
      // Ignore
    }
    return 0;
  }

  private mapRecordToItem(record: LogRecord): LogItem {
    return {
      id: record.id,
      timestamp: record.timestamp,
      level: record.level as LogLevel,
      severity: record.severity,
      message: record.message,
      category: record.category,
      source: record.source as any,
      module: record.module,
      event: record.event,
      requestId: record.requestId,
      sessionId: record.sessionId,
      userAction: record.userAction,
      durationMs: record.durationMs,
      status: record.status,
      errorName: record.errorName,
      errorMessage: record.errorMessage,
      errorStack: record.errorStack,
      metadata: record.metadata,
      createdAt: record.createdAt,
    };
  }
}
