import { DatabaseService } from '../index';
import { Flashcard, FlashcardRating } from '../../shared/types';

export class FlashcardRepository {
  private get db() {
    return DatabaseService.getInstance();
  }

  public getDueCards(limit = 30): Flashcard[] {
    const sql = `
      SELECT f.*, v.word, v.language, v.translation as vocab_translation, 
             v.pinyin as vocab_pinyin, v.ipa, v.part_of_speech, v.hsk_level, v.cefr_level
      FROM flashcards f
      JOIN vocabulary v ON f.vocabulary_id = v.id
      WHERE f.due <= datetime('now')
      ORDER BY f.due ASC
      LIMIT ?
    `;
    const rows = this.db.query<any>(sql, [limit]);
    return rows.map((r) => this.mapRowToFlashcard(r));
  }

  public getAllCards(): Flashcard[] {
    const sql = `
      SELECT f.*, v.word, v.language, v.translation as vocab_translation, 
             v.pinyin as vocab_pinyin, v.ipa, v.part_of_speech, v.hsk_level, v.cefr_level
      FROM flashcards f
      JOIN vocabulary v ON f.vocabulary_id = v.id
      ORDER BY f.due ASC
    `;
    const rows = this.db.query<any>(sql);
    return rows.map((r) => this.mapRowToFlashcard(r));
  }

  public getStats() {
    const dueCount = this.db.query<{ count: number }>(
      "SELECT COUNT(*) as count FROM flashcards WHERE due <= datetime('now')"
    )[0]?.count || 0;

    const totalCount = this.db.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM flashcards'
    )[0]?.count || 0;

    const masteredCount = this.db.query<{ count: number }>(
      "SELECT COUNT(*) as count FROM flashcards WHERE state = 'mastered'"
    )[0]?.count || 0;

    const learningCount = this.db.query<{ count: number }>(
      "SELECT COUNT(*) as count FROM flashcards WHERE state = 'learning' OR state = 'new'"
    )[0]?.count || 0;

    return {
      due: dueCount,
      total: totalCount,
      mastered: masteredCount,
      learning: learningCount,
    };
  }

  public review(flashcardId: number, rating: FlashcardRating): Flashcard {
    const cards = this.db.query<any>('SELECT * FROM flashcards WHERE id = ?', [flashcardId]);
    if (!cards.length) throw new Error('Flashcard not found');

    const card = cards[0];
    let interval = card.interval || 0;
    let easeFactor = card.ease_factor || 2.5;
    let reps = card.reps || 0;
    let lapses = card.lapses || 0;
    let state = card.state || 'learning';

    switch (rating) {
      case 1: // Again
        reps = 0;
        lapses += 1;
        interval = 1;
        easeFactor = Math.max(1.3, easeFactor - 0.2);
        state = 'learning';
        break;

      case 2: // Hard
        reps += 1;
        interval = Math.max(1, Math.round((interval || 1) * 1.2));
        easeFactor = Math.max(1.3, easeFactor - 0.15);
        state = 'review';
        break;

      case 3: // Good
        if (reps === 0) {
          interval = 1;
        } else if (reps === 1) {
          interval = 6;
        } else {
          interval = Math.round(interval * easeFactor);
        }
        reps += 1;
        state = reps >= 4 ? 'mastered' : 'review';
        break;

      case 4: // Easy
        if (reps === 0) {
          interval = 4;
        } else if (reps === 1) {
          interval = 10;
        } else {
          interval = Math.round(interval * easeFactor * 1.3);
        }
        reps += 1;
        easeFactor = Math.min(3.0, easeFactor + 0.15);
        state = reps >= 3 ? 'mastered' : 'review';
        break;
    }

    const nextDueDate = new Date(Date.now() + interval * 24 * 60 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19);

    this.db.run(
      `UPDATE flashcards SET
        interval = ?,
        ease_factor = ?,
        reps = ?,
        lapses = ?,
        state = ?,
        due = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [interval, easeFactor, reps, lapses, state, nextDueDate, flashcardId]
    );

    // Update vocabulary table review stats
    this.db.run(
      `UPDATE vocabulary SET
        last_reviewed_at = CURRENT_TIMESTAMP,
        next_review_at = ?,
        ease_factor = ?,
        repetition_count = repetition_count + 1,
        interval_days = ?
      WHERE id = ?`,
      [nextDueDate, easeFactor, interval, card.vocabulary_id]
    );

    // Record review log
    this.db.run(
      `INSERT INTO review_sessions (flashcard_id, rating, elapsed_days, scheduled_days, review_type)
       VALUES (?, ?, ?, ?, 'sm2')`,
      [flashcardId, rating, interval, interval]
    );

    // Increment today's words_reviewed in learning_statistics
    const today = new Date().toISOString().split('T')[0];
    this.db.run(
      `INSERT INTO learning_statistics (date, words_reviewed) 
       VALUES (?, 1)
       ON CONFLICT(date) DO UPDATE SET words_reviewed = words_reviewed + 1`,
      [today]
    );

    const updated = this.db.query<any>(
      `SELECT f.*, v.word, v.language, v.translation as vocab_translation, 
              v.pinyin as vocab_pinyin, v.ipa, v.part_of_speech, v.hsk_level, v.cefr_level
       FROM flashcards f
       JOIN vocabulary v ON f.vocabulary_id = v.id
       WHERE f.id = ?`,
      [flashcardId]
    );

    return this.mapRowToFlashcard(updated[0]);
  }

  private mapRowToFlashcard(r: any): Flashcard {
    return {
      id: r.id,
      vocabularyId: r.vocabulary_id,
      front: r.front,
      back: r.back,
      pinyin: r.pinyin || r.vocab_pinyin,
      note: r.note,
      state: r.state,
      interval: r.interval,
      easeFactor: r.ease_factor,
      reps: r.reps,
      lapses: r.lapses,
      due: r.due,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      vocabulary: {
        id: r.vocabulary_id,
        word: r.word,
        language: r.language,
        translation: r.vocab_translation,
        pinyin: r.vocab_pinyin,
        ipa: r.ipa,
        partOfSpeech: r.part_of_speech,
        hskLevel: r.hsk_level,
        cefrLevel: r.cefr_level,
      },
    };
  }
}
