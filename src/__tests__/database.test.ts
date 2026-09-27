import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DatabaseService } from '../database';
import { VocabularyRepository } from '../database/repositories/vocabularyRepository';
import { SettingsRepository } from '../database/repositories/settingsRepository';
import fs from 'fs';
import path from 'path';

describe('DatabaseService & Repositories', () => {
  const testDir = path.join(process.cwd(), 'tmp_test_db');

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

  it('should initialize tables and seed default vocabulary', () => {
    const vocabRepo = new VocabularyRepository();
    const all = vocabRepo.getAll();
    expect(all.length).toBeGreaterThan(0);

    const juese = vocabRepo.getByWord('角色', 'zh');
    expect(juese).toBeDefined();
    expect(juese?.translation).toContain('nhân vật');
    expect(juese?.pinyin).toBe('juésè');
  });

  it('should save new vocabulary items and find by search', () => {
    const vocabRepo = new VocabularyRepository();
    const saved = vocabRepo.save({
      word: '电脑',
      language: 'zh',
      translation: 'máy vi tính',
      pinyin: 'diànnǎo',
      partOfSpeech: 'Danh từ',
      hskLevel: 1,
    });

    expect(saved.id).toBeDefined();
    expect(saved.word).toBe('电脑');

    const searchResults = vocabRepo.search('máy vi tính');
    expect(searchResults.some((item) => item.word === '电脑')).toBe(true);
  });

  it('should get and save settings correctly', () => {
    const settingsRepo = new SettingsRepository();
    const initial = settingsRepo.getSettings();
    expect(initial.general.nativeLanguage).toBe('vi');

    const updated = settingsRepo.saveSettings({
      general: { ...initial.general, startAtLogin: true },
    });
    expect(updated.general.startAtLogin).toBe(true);

    const reloaded = settingsRepo.getSettings();
    expect(reloaded.general.startAtLogin).toBe(true);
  });
});
