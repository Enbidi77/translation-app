import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';

export const logs = sqliteTable(
  'logs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    timestamp: integer('timestamp').notNull(),
    level: text('level').notNull(),
    severity: integer('severity').notNull(),
    message: text('message').notNull(),
    category: text('category'),
    source: text('source'),
    module: text('module'),
    event: text('event'),
    requestId: text('request_id'),
    sessionId: text('session_id'),
    userAction: text('user_action'),
    durationMs: integer('duration_ms'),
    status: text('status'),
    errorName: text('error_name'),
    errorMessage: text('error_message'),
    errorStack: text('error_stack'),
    metadata: text('metadata'),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    index('idx_logs_timestamp').on(table.timestamp),
    index('idx_logs_level').on(table.level),
    index('idx_logs_severity').on(table.severity),
    index('idx_logs_category').on(table.category),
    index('idx_logs_source').on(table.source),
    index('idx_logs_module').on(table.module),
    index('idx_logs_event').on(table.event),
    index('idx_logs_request_id').on(table.requestId),
    index('idx_logs_session_id').on(table.sessionId),
    index('idx_logs_timestamp_severity').on(table.timestamp, table.severity),
  ]
);

export type LogRecord = typeof logs.$inferSelect;
export type NewLogRecord = typeof logs.$inferInsert;
