import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DatabaseService } from '../database';
import { FlashcardRepository } from '../database/repositories/flashcardRepository';
import { VocabularyRepository } from '../database/repositories/vocabularyRepository';
import fs from 'fs';
import path from 'path';

describe('FlashcardRepository SM-2 Algorithm', () => {
  const testDir = path.join(process.cwd(), 'tmp_test_srs');

  beforeAll(async () => {
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
    await DatabaseService.getInstance().initialize(testDir);
  });

  afterAll(() => {
    DatabaseService.getInstance().close();
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  it('should retrieve due flashcards and calculate review progress', () => {
    const flashcardRepo = new FlashcardRepository();
    const due = flashcardRepo.getDueCards(10);
    expect(due.length).toBeGreaterThan(0);

    const card = due[0];
    expect(card.front).toBeTruthy();
    expect(card.back).toBeTruthy();

    // Review with Rating 3 (Good)
    const reviewedGood = flashcardRepo.review(card.id, 3);
    expect(reviewedGood.reps).toBe(card.reps + 1);
    expect(reviewedGood.interval).toBeGreaterThanOrEqual(1);

    // Review with Rating 1 (Again)
    const reviewedAgain = flashcardRepo.review(card.id, 1);
    expect(reviewedAgain.reps).toBe(0);
    expect(reviewedAgain.interval).toBe(1);
    expect(reviewedAgain.state).toBe('learning');
  });

  it('should calculate accurate SRS statistics', () => {
    const flashcardRepo = new FlashcardRepository();
    const stats = flashcardRepo.getStats();
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.due).toBeGreaterThanOrEqual(0);
  });
});
