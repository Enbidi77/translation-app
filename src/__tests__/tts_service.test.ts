import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TtsService } from '../main/services/ttsService';
import { DatabaseService } from '../database';
import path from 'path';
import fs from 'fs';

const TEST_DB_PATH = path.join(process.cwd(), 'tmp_test_tts_db', 'polyglot_learning.db');

describe('Text-To-Speech (TTS) Service', () => {
  let ttsService: TtsService;

  beforeAll(async () => {
    const dir = path.dirname(TEST_DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const db = DatabaseService.getInstance();
    await db.initialize(TEST_DB_PATH);
    ttsService = TtsService.getInstance();
  });

  afterAll(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
      } catch (_) {}
    }
    const dir = path.dirname(TEST_DB_PATH);
    if (fs.existsSync(dir)) {
      try {
        fs.rmdirSync(dir);
      } catch (_) {}
    }
  });

  it('should correctly normalize language codes and auto-detect language from text', () => {
    expect(ttsService.normalizeLang('zh')).toBe('zh-CN');
    expect(ttsService.normalizeLang('zh-CN')).toBe('zh-CN');
    expect(ttsService.normalizeLang('chinese')).toBe('zh-CN');
    expect(ttsService.normalizeLang('en')).toBe('en');
    expect(ttsService.normalizeLang('en-US')).toBe('en');
    expect(ttsService.normalizeLang('vi')).toBe('vi');
    expect(ttsService.normalizeLang('vi-VN')).toBe('vi');

    // Auto-detect Chinese characters when lang is missing
    expect(ttsService.normalizeLang(undefined, '你好世界')).toBe('zh-CN');
    // Auto-detect Vietnamese
    expect(ttsService.normalizeLang(undefined, 'Xin chào các bạn')).toBe('vi');
    // Default English
    expect(ttsService.normalizeLang(undefined, 'Welcome everyone')).toBe('en');
  });

  it('should synthesize Chinese speech with valid mp3 audio data', async () => {
    const res = await ttsService.synthesize({
      text: '你好，很高兴认识你',
      lang: 'zh',
      slow: false,
    });

    expect(res.success).toBe(true);
    expect(res.audioData).toBeDefined();
    expect(res.audioData?.startsWith('data:audio/mp3;base64,')).toBe(true);
    expect(res.format).toBe('audio/mp3');
    expect(res.lang).toBe('zh-CN');
    expect(res.cached).toBe(false);
  }, 10000);

  it('should synthesize English speech with valid mp3 audio data', async () => {
    const res = await ttsService.synthesize({
      text: 'Hello, this is a pronunciation test.',
      lang: 'en',
      slow: false,
    });

    expect(res.success).toBe(true);
    expect(res.audioData).toBeDefined();
    expect(res.audioData?.startsWith('data:audio/mp3;base64,')).toBe(true);
    expect(res.format).toBe('audio/mp3');
    expect(res.lang).toBe('en');
  }, 10000);

  it('should return cached audio on repeated requests for zero-latency playback', async () => {
    const text = '缓存测试词汇';
    const first = await ttsService.synthesize({ text, lang: 'zh' });
    expect(first.success).toBe(true);
    expect(first.cached).toBe(false);

    const second = await ttsService.synthesize({ text, lang: 'zh' });
    expect(second.success).toBe(true);
    expect(second.cached).toBe(true);
    expect(second.audioData).toBe(first.audioData);
  }, 10000);

  it('should handle slow speed mode for pronunciation practice', async () => {
    const res = await ttsService.synthesize({
      text: '慢慢地读',
      lang: 'zh',
      slow: true,
    });

    expect(res.success).toBe(true);
    expect(res.audioData).toBeDefined();
  }, 10000);
});
