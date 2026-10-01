import fs from 'fs';
import path from 'path';
import initSqlJs, { Database, SqlValue } from 'sql.js';
import { drizzle, SQLJsDatabase } from 'drizzle-orm/sql-js';
import { DB_SCHEMA_SQL } from './schema';
import * as logsSchema from './schema/logs';
import { SEED_LANGUAGES, SEED_VOCABULARY } from './seeds/defaultVocabulary';

export class DatabaseService {
  private static instance: DatabaseService | null = null;
  private db: Database | null = null;
  private drizzleDb: SQLJsDatabase<typeof logsSchema> | null = null;
  private dbPath: string = '';
  private saveTimeout: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(storageDir?: string): Promise<void> {
    if (this.db) return;

    const baseDir = storageDir || process.cwd();
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    this.dbPath = path.join(baseDir, 'polyglot_learning.db');

    // Locate wasm file if needed
    const SQL = await initSqlJs({
      locateFile: (file) => {
        // Try common locations for sql-wasm.wasm
        const candidates = [
          path.join(process.cwd(), 'node_modules/sql.js/dist', file),
          path.join(__dirname, '..', '..', 'node_modules/sql.js/dist', file),
          path.join(__dirname, file),
        ];
        for (const c of candidates) {
          if (fs.existsSync(c)) return c;
        }
        return file;
      },
    });

    if (fs.existsSync(this.dbPath)) {
      try {
        const fileBuffer = fs.readFileSync(this.dbPath);
        this.db = new SQL.Database(fileBuffer);
        console.log('[Database] Loaded existing database from:', this.dbPath);
      } catch (err) {
        console.error('[Database] Failed to load existing database, creating fresh one:', err);
        this.db = new SQL.Database();
      }
    } else {
      console.log('[Database] Creating new database at:', this.dbPath);
      this.db = new SQL.Database();
    }

    // Run schema migrations
    this.db.run(DB_SCHEMA_SQL);

    // Run seed data if empty
    this.seedDefaultsIfEmpty();

    // Persist initial state
    this.persistSync();
  }

  private seedDefaultsIfEmpty(): void {
    if (!this.db) return;

    // Check languages
    const langRes = this.db.exec('SELECT COUNT(*) as count FROM languages');
    const langCount = (langRes[0]?.values[0]?.[0] as number) || 0;
    const stmt = this.db.prepare('INSERT OR IGNORE INTO languages (code, name, native_name) VALUES (?, ?, ?)');
    for (const lang of SEED_LANGUAGES) {
      stmt.run([lang.code, lang.name, lang.native_name]);
    }
    stmt.free();

    // Check vocabulary
    const vocabRes = this.db.exec('SELECT COUNT(*) as count FROM vocabulary');
    const vocabCount = (vocabRes[0]?.values[0]?.[0] as number) || 0;
    if (vocabCount === 0) {
      console.log('[Database] Seeding initial vocabulary & flashcards...');
      const vocabStmt = this.db.prepare(`
        INSERT INTO vocabulary (
          word, language, translation, pinyin, ipa, part_of_speech, definition, 
          difficulty, hsk_level, cefr_level, source, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const exampleStmt = this.db.prepare(`
        INSERT INTO vocabulary_examples (vocabulary_id, sentence, pinyin, translation)
        VALUES (?, ?, ?, ?)
      `);

      const flashcardStmt = this.db.prepare(`
        INSERT INTO flashcards (vocabulary_id, front, back, pinyin, note, state, interval, ease_factor, due)
        VALUES (?, ?, ?, ?, ?, 'learning', 1, 2.5, datetime('now'))
      `);

      for (const v of SEED_VOCABULARY) {
        vocabStmt.run([
          v.word,
          v.language,
          v.translation,
          v.pinyin || null,
          v.ipa || null,
          v.part_of_speech || null,
          v.definition || null,
          v.difficulty || 1,
          v.hsk_level || null,
          v.cefr_level || null,
          v.source || 'seed',
          v.notes || null,
        ]);

        const idRes = this.db.exec('SELECT last_insert_rowid() as id');
        const vocabId = idRes[0]?.values[0]?.[0] as number;

        if (vocabId && v.examples) {
          for (const ex of v.examples) {
            const pinyinVal = 'pinyin' in ex ? (ex as any).pinyin : null;
            exampleStmt.run([vocabId, ex.sentence, pinyinVal, ex.translation]);
          }
        }

        if (vocabId) {
          flashcardStmt.run([
            vocabId,
            v.word,
            v.translation,
            v.pinyin || v.ipa || null,
            v.notes || null,
          ]);
        }
      }

      vocabStmt.free();
      exampleStmt.free();
      flashcardStmt.free();
    }

    // Seed sample learning stats
    const statsRes = this.db.exec('SELECT COUNT(*) as count FROM learning_statistics');
    const statsCount = (statsRes[0]?.values[0]?.[0] as number) || 0;
    if (statsCount === 0) {
      const today = new Date().toISOString().split('T')[0];
      this.db.run(`
        INSERT INTO learning_statistics (
          date, words_learned, words_reviewed, listening_minutes, speaking_minutes,
          study_minutes_chinese, study_minutes_english, streak_days
        ) VALUES ('${today}', 12, 28, 15, 8, 25, 15, 5)
      `);
    }
  }

  public isInitialized(): boolean {
    return this.db !== null;
  }

  public getDbPath(): string {
    return this.dbPath;
  }

  public getRawDb(): Database {
    if (!this.db) {
      throw new Error('[Database] Database not initialized!');
    }
    return this.db;
  }

  public getDrizzle(): SQLJsDatabase<typeof logsSchema> {
    if (!this.db) {
      throw new Error('[Database] Database not initialized!');
    }
    if (!this.drizzleDb) {
      this.drizzleDb = drizzle(this.db, { schema: logsSchema });
    }
    return this.drizzleDb;
  }

  public query<T = any>(sql: string, params: SqlValue[] = []): T[] {
    if (!this.db) throw new Error('[Database] Database not initialized');
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as T);
    }
    stmt.free();
    return results;
  }

  public run(sql: string, params: SqlValue[] = []): { lastInsertRowId: number; changes: number } {
    if (!this.db) throw new Error('[Database] Database not initialized');
    this.db.run(sql, params);
    const idRes = this.db.exec('SELECT last_insert_rowid() as id');
    const changesRes = this.db.exec('SELECT changes() as c');
    const lastId = (idRes[0]?.values[0]?.[0] as number) || 0;
    const changes = (changesRes[0]?.values[0]?.[0] as number) || 0;

    this.scheduleSave();
    return { lastInsertRowId: lastId, changes };
  }

  public scheduleSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.persistSync();
    }, 250);
  }

  public persistSync(): void {
    if (!this.db || !this.dbPath) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (err) {
      console.error('[Database] Failed to persist SQLite data:', err);
    }
  }

  public close(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.persistSync();
    if (this.db) {
      this.db.close();
      this.db = null;
      this.drizzleDb = null;
    }
  }
}
