import { DatabaseService } from '../index';
import { TranslationHistoryItem } from '../../shared/types';

export class HistoryRepository {
  private get db() {
    return DatabaseService.getInstance();
  }

  public getHistory(limit = 100): TranslationHistoryItem[] {
    const sql = `
      SELECT * FROM translation_history 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    const rows = this.db.query<any>(sql, [limit]);
    return rows.map((r) => ({
      id: r.id,
      sourceText: r.source_text,
      sourceLang: r.source_lang,
      targetText: r.target_text,
      targetLang: r.target_lang,
      pinyin: r.pinyin,
      sourceType: r.source_type,
      provider: r.provider,
      metadata: r.metadata,
      createdAt: r.created_at,
    }));
  }

  public saveItem(item: Omit<TranslationHistoryItem, 'id' | 'createdAt'>): TranslationHistoryItem {
    const res = this.db.run(
      `INSERT INTO translation_history (
        source_text, source_lang, target_text, target_lang, pinyin, source_type, provider, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.sourceText,
        item.sourceLang,
        item.targetText,
        item.targetLang,
        item.pinyin || null,
        item.sourceType,
        item.provider,
        item.metadata || null,
      ]
    );

    const rows = this.db.query<any>('SELECT * FROM translation_history WHERE id = ?', [res.lastInsertRowId]);
    const r = rows[0];
    return {
      id: r.id,
      sourceText: r.source_text,
      sourceLang: r.source_lang,
      targetText: r.target_text,
      targetLang: r.target_lang,
      pinyin: r.pinyin,
      sourceType: r.source_type,
      provider: r.provider,
      metadata: r.metadata,
      createdAt: r.created_at,
    };
  }

  public clear(): void {
    this.db.run('DELETE FROM translation_history');
  }

  public deleteItem(id: number): void {
    this.db.run('DELETE FROM translation_history WHERE id = ?', [id]);
  }
}
