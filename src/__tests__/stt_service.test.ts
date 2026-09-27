import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SttService } from '../main/services/sttService';
import { DatabaseService } from '../database';
import { TranslationManager } from '../providers/translation';
import { AiManager } from '../providers/ai';
import path from 'path';
import fs from 'fs';

const TEST_DB_PATH = path.join(process.cwd(), 'tmp_test_stt_db', 'polyglot_learning.db');

describe('Speech-To-Text (STT) & Realtime Voice Translation Service', () => {
  let sttService: SttService;

  beforeAll(async () => {
    const dir = path.dirname(TEST_DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const db = DatabaseService.getInstance();
    await db.initialize(TEST_DB_PATH);
    sttService = SttService.getInstance();
    const aiManager = new AiManager();
    const transManager = new TranslationManager(aiManager);
    sttService.setTranslationManager(transManager);
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

  it('should reject empty audio data with INVALID_AUDIO error', async () => {
    const res = await sttService.transcribeAndTranslate({
      audioData: '',
      sourceLang: 'zh-CN',
      targetLang: 'vi',
    });

    expect(res.success).toBe(false);
    expect(res.errorCode).toBe('INVALID_AUDIO');
  });

  it('should return NO_API_KEY with user-friendly guidance when API keys are not configured', async () => {
    // Send a small dummy base64 chunk
    const dummyBase64 = Buffer.from('RIFF....WAVEfmt ').toString('base64');
    const res = await sttService.transcribeAndTranslate({
      audioData: dummyBase64,
      mimeType: 'audio/webm',
      sourceLang: 'zh-CN',
      targetLang: 'vi',
    });

    expect(res.success).toBe(false);
    expect(res.errorCode).toBe('NO_API_KEY');
    expect(res.error).toContain('Cài đặt');
  });

  it('should correctly strip data URI headers before processing', async () => {
    const dummyDataUri = 'data:audio/webm;base64,' + Buffer.from('dummy-audio-bytes').toString('base64');
    const res = await sttService.transcribeAndTranslate({
      audioData: dummyDataUri,
      sourceLang: 'en-US',
      targetLang: 'vi',
    });

    expect(res.success).toBe(false);
    // Should pass data URI parsing and reach API key check
    expect(res.errorCode).toBe('NO_API_KEY');
  });
});
