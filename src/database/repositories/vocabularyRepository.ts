import { DatabaseService } from '../index';
import { VocabularyItem, VocabularyExample } from '../../shared/types';

export class VocabularyRepository {
  private get db() {
    return DatabaseService.getInstance();
  }

  public getAll(language?: string): VocabularyItem[] {
    let sql = 'SELECT * FROM vocabulary';
    const params: any[] = [];
    if (language) {
      sql += ' WHERE language = ?';
      params.push(language);
    }
    sql += ' ORDER BY created_at DESC';

    const rows = this.db.query<any>(sql, params);
    return rows.map((r) => this.mapRowToVocab(r));
  }

  public getById(id: number): VocabularyItem | null {
    const rows = this.db.query<any>('SELECT * FROM vocabulary WHERE id = ?', [id]);
    if (!rows.length) return null;

    const vocab = this.mapRowToVocab(rows[0]);
    vocab.examples = this.getExamplesForVocab(id);
    return vocab;
  }

  public getByWord(word: string, language: string): VocabularyItem | null {
    const rows = this.db.query<any>('SELECT * FROM vocabulary WHERE word = ? AND language = ?', [word, language]);
    if (!rows.length) return null;
    const vocab = this.mapRowToVocab(rows[0]);
    vocab.examples = this.getExamplesForVocab(vocab.id!);
    return vocab;
  }

  public search(query: string): VocabularyItem[] {
    const term = `%${query.trim()}%`;
    const sql = `
      SELECT * FROM vocabulary 
      WHERE word LIKE ? OR pinyin LIKE ? OR translation LIKE ? OR definition LIKE ?
      ORDER BY 
        CASE 
          WHEN word = ? THEN 1
          WHEN word LIKE ? THEN 2
          ELSE 3
        END,
        created_at DESC
      LIMIT 50
    `;
    const rows = this.db.query<any>(sql, [term, term, term, term, query, `${query}%`]);
    return rows.map((r) => this.mapRowToVocab(r));
  }

  public save(item: VocabularyItem): VocabularyItem {
    const existing = this.getByWord(item.word, item.language);
    let vocabId: number;

    if (existing && existing.id) {
      // Update
      this.db.run(
        `UPDATE vocabulary SET 
          translation = ?, pinyin = ?, ipa = ?, part_of_speech = ?, definition = ?,
          difficulty = ?, hsk_level = ?, cefr_level = ?, source = ?, notes = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          item.translation,
          item.pinyin || null,
          item.ipa || null,
          item.partOfSpeech || null,
          item.definition || null,
          item.difficulty || 1,
          item.hskLevel || null,
          item.cefrLevel || null,
          item.source || 'manual',
          item.notes || null,
          existing.id,
        ]
      );
      vocabId = existing.id;
    } else {
      // Insert
      const res = this.db.run(
        `INSERT INTO vocabulary (
          word, language, translation, pinyin, ipa, part_of_speech, definition,
          difficulty, hsk_level, cefr_level, source, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          item.word,
          item.language,
          item.translation,
          item.pinyin || null,
          item.ipa || null,
          item.partOfSpeech || null,
          item.definition || null,
          item.difficulty || 1,
          item.hskLevel || null,
          item.cefrLevel || null,
          item.source || 'manual',
          item.notes || null,
        ]
      );
      vocabId = res.lastInsertRowId;

      // Automatically create corresponding flashcard for this word
      this.db.run(
        `INSERT OR IGNORE INTO flashcards (
          vocabulary_id, front, back, pinyin, note, state, interval, ease_factor, due
        ) VALUES (?, ?, ?, ?, ?, 'learning', 1, 2.5, datetime('now'))`,
        [
          vocabId,
          item.word,
          item.translation,
          item.pinyin || item.ipa || null,
          item.notes || null,
        ]
      );
    }

    // Save examples if any
    if (item.examples && item.examples.length) {
      for (const ex of item.examples) {
        if (!ex.id) {
          this.db.run(
            `INSERT INTO vocabulary_examples (vocabulary_id, sentence, pinyin, translation) VALUES (?, ?, ?, ?)`,
            [vocabId, ex.sentence, ex.pinyin || null, ex.translation]
          );
        }
      }
    }

    return this.getById(vocabId)!;
  }

  public delete(id: number): boolean {
    this.db.run('DELETE FROM vocabulary WHERE id = ?', [id]);
    this.db.run('DELETE FROM flashcards WHERE vocabulary_id = ?', [id]);
    this.db.run('DELETE FROM vocabulary_examples WHERE vocabulary_id = ?', [id]);
    return true;
  }

  private getExamplesForVocab(vocabId: number): VocabularyExample[] {
    const rows = this.db.query<any>(
      'SELECT * FROM vocabulary_examples WHERE vocabulary_id = ? ORDER BY id ASC',
      [vocabId]
    );
    return rows.map((r) => ({
      id: r.id,
      vocabularyId: r.vocabulary_id,
      sentence: r.sentence,
      pinyin: r.pinyin,
      translation: r.translation,
    }));
  }

  private mapRowToVocab(row: any): VocabularyItem {
    return {
      id: row.id,
      word: row.word,
      language: row.language,
      translation: row.translation,
      pinyin: row.pinyin,
      ipa: row.ipa,
      partOfSpeech: row.part_of_speech,
      definition: row.definition,
      difficulty: row.difficulty,
      hskLevel: row.hsk_level,
      cefrLevel: row.cefr_level,
      source: row.source,
      notes: row.notes,
      easeFactor: row.ease_factor,
      repetitionCount: row.repetition_count,
      intervalDays: row.interval_days,
      lastReviewedAt: row.last_reviewed_at,
      nextReviewAt: row.next_review_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
