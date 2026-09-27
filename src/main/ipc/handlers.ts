import { ipcMain, app, BrowserWindow, nativeTheme } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/ipc';
import { DatabaseService } from '../../database';
import { VocabularyRepository } from '../../database/repositories/vocabularyRepository';
import { FlashcardRepository } from '../../database/repositories/flashcardRepository';
import { HistoryRepository } from '../../database/repositories/historyRepository';
import { SettingsRepository } from '../../database/repositories/settingsRepository';
import { StatisticsRepository } from '../../database/repositories/statisticsRepository';
import { TranslationManager } from '../../providers/translation';
import { OcrManager } from '../../providers/ocr';
import { AiManager } from '../../providers/ai';
import { ScreenService, CropRect } from '../services/screenService';
import { SnipWindowManager } from '../windows/snipWindow';
import { OverlayWindowManager } from '../windows/overlayWindow';
import { SubtitleWindowManager } from '../windows/subtitleWindow';
import { ShortcutService } from '../services/shortcutService';
import { ClipboardService } from '../services/clipboardService';
import { TtsService } from '../services/ttsService';
import { SttService } from '../services/sttService';
import { registerLogIpcHandlers } from './logHandlers';
import { logger } from '../logging/logger';

function logIpcCall(channel: string, start: number, success: boolean, error?: any) {
  const durationMs = Date.now() - start;
  if (success) {
    logger.debug(`IPC: ${channel} completed`, {
      category: 'ipc',
      source: 'ipc',
      event: 'ipc_completed',
      durationMs,
      status: 'success',
      metadata: { channel },
    });
  } else {
    logger.error(`IPC: ${channel} failed`, {
      category: 'ipc',
      source: 'ipc',
      event: 'ipc_failed',
      durationMs,
      status: 'failed',
      error,
      metadata: { channel },
    });
  }
}

export function setupIpcHandlers() {
  registerLogIpcHandlers();
  const ttsService = TtsService.getInstance();
  const sttService = SttService.getInstance();
  const vocabRepo = new VocabularyRepository();
  const flashcardRepo = new FlashcardRepository();
  const historyRepo = new HistoryRepository();
  const settingsRepo = new SettingsRepository();
  const statsRepo = new StatisticsRepository();

  const aiManager = new AiManager();
  const transManager = new TranslationManager(aiManager);
  const ocrManager = new OcrManager();
  sttService.setTranslationManager(transManager);

  // Load and apply initial settings
  const currentSettings = settingsRepo.getSettings();
  aiManager.updateConfig(currentSettings.providers);
  ocrManager.updateConfig(currentSettings.providers);
  transManager.setPreferredProvider(currentSettings.providers.translationProvider);

  // Apply theme to Electron nativeTheme
  nativeTheme.themeSource = currentSettings.general.theme || 'dark';

  const broadcastTheme = (themeMode?: string, subtitleTheme?: string) => {
    const current = settingsRepo.getSettings();
    const mode = (themeMode || current.general.theme || 'dark') as 'dark' | 'light' | 'system';
    const subTheme = subtitleTheme || current.subtitles?.subtitleTheme || 'follow_app';
    const effectiveTheme = mode === 'system' ? (nativeTheme.shouldUseDarkColors ? 'dark' : 'light') : mode;

    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send(IPC_CHANNELS.EVENT_THEME_UPDATED, {
          theme: mode,
          effectiveTheme,
          subtitleTheme: subTheme,
        });
      }
    });
  };

  nativeTheme.on('updated', () => {
    const current = settingsRepo.getSettings();
    if (current.general.theme === 'system') {
      broadcastTheme('system', current.subtitles?.subtitleTheme);
    }
  });

  // App & Window Handlers
  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, () => app.getVersion());

  ipcMain.on(IPC_CHANNELS.APP_MINIMIZE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.minimize();
  });

  ipcMain.on(IPC_CHANNELS.APP_MAXIMIZE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win?.isMaximized()) {
      win.unmaximize();
    } else {
      win?.maximize();
    }
  });

  ipcMain.on(IPC_CHANNELS.APP_CLOSE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.close();
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_SET_ALWAYS_ON_TOP, (event, flag: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.setAlwaysOnTop(flag, 'floating');
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_SET_CLICK_THROUGH, (event, flag: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      if (flag) {
        win.setIgnoreMouseEvents(true, { forward: true });
      } else {
        win.setIgnoreMouseEvents(false);
      }
    }
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_SET_OPACITY, (event, opacity: number) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.setOpacity(Math.max(0.2, Math.min(1.0, opacity)));
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_TRIGGER_SNIP, () => {
    SnipWindowManager.getInstance().startSnip();
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_CANCEL_SNIP, () => {
    SnipWindowManager.getInstance().close();
  });

  // When user finishes drawing snip rectangle
  ipcMain.handle(IPC_CHANNELS.WINDOW_COMPLETE_SNIP, async (event, rect: CropRect) => {
    try {
      SnipWindowManager.getInstance().close();
      await new Promise((resolve) => setTimeout(resolve, 80));

      // 1. Crop area
      const croppedDataUrl = await ScreenService.captureRect(rect);

      // 2. Perform OCR
      const ocrResult = await ocrManager.recognize(croppedDataUrl);
      if (!ocrResult || !ocrResult.text || !ocrResult.text.trim()) {
        console.warn('[Snip] No text detected in cropped region.');
        await OverlayWindowManager.getInstance().showWithData({
          sourceText: '（Không nhận diện được văn bản trong vùng đã chọn）',
          translatedText: 'Gợi ý: Hãy quét lại vùng màn hình có chứa chữ rõ nét hơn.',
          sourceLang: 'zh',
          targetLang: 'vi',
          provider: 'none',
        }, rect);
        return null;
      }

      // 3. Translate
      const transResult = await transManager.translate({
        text: ocrResult.text,
        sourceLang: ocrResult.detectedLang || 'auto',
        targetLang: 'vi',
        mode: 'learning',
      });

      // 4. Record history
      historyRepo.saveItem({
        sourceText: transResult.sourceText,
        sourceLang: transResult.sourceLang,
        targetText: transResult.translatedText,
        targetLang: transResult.targetLang,
        pinyin: transResult.pinyin,
        sourceType: 'screen',
        provider: transResult.provider,
      });

      // 5. Open Floating Translation Overlay at coordinates
      await OverlayWindowManager.getInstance().showWithData(transResult, rect);

      return transResult;
    } catch (err: any) {
      console.error('[Snip] Processing failed:', err);
      throw err;
    }
  });

  // Settings Handlers
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
    return settingsRepo.getSettings();
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SAVE, (event, newSettings) => {
    const updated = settingsRepo.saveSettings(newSettings);
    // Update theme if changed
    if (updated.general?.theme) {
      nativeTheme.themeSource = updated.general.theme;
      broadcastTheme(updated.general.theme, updated.subtitles?.subtitleTheme);
    }
    // Update active service configs
    aiManager.updateConfig(updated.providers);
    ocrManager.updateConfig(updated.providers);
    transManager.setPreferredProvider(updated.providers.translationProvider);
    ShortcutService.getInstance().registerShortcuts(updated.hotkeys);
    ClipboardService.getInstance().setEnabled(updated.general.enableClipboardWatcher);
    return updated;
  });

  // Theme Handlers
  ipcMain.handle(IPC_CHANNELS.THEME_CHANGE, (event, mode: 'dark' | 'light' | 'system') => {
    nativeTheme.themeSource = mode;
    const current = settingsRepo.getSettings();
    const updated = settingsRepo.saveSettings({
      general: {
        ...current.general,
        theme: mode,
      },
    });
    broadcastTheme(mode, updated.subtitles?.subtitleTheme);
    const effectiveTheme = mode === 'system' ? (nativeTheme.shouldUseDarkColors ? 'dark' : 'light') : mode;
    return { theme: mode, effectiveTheme };
  });

  ipcMain.handle(IPC_CHANNELS.THEME_GET, () => {
    const current = settingsRepo.getSettings();
    const mode = current.general.theme || 'dark';
    const effectiveTheme = mode === 'system' ? (nativeTheme.shouldUseDarkColors ? 'dark' : 'light') : mode;
    return {
      theme: mode,
      effectiveTheme,
      subtitleTheme: current.subtitles?.subtitleTheme || 'follow_app',
    };
  });

  // Vocabulary Handlers
  ipcMain.handle(IPC_CHANNELS.VOCAB_GET_ALL, (event, lang?: string) => {
    return vocabRepo.getAll(lang);
  });

  ipcMain.handle(IPC_CHANNELS.VOCAB_GET_BY_ID, (event, id: number) => {
    return vocabRepo.getById(id);
  });

  ipcMain.handle(IPC_CHANNELS.VOCAB_SEARCH, (event, query: string) => {
    return vocabRepo.search(query);
  });

  ipcMain.handle(IPC_CHANNELS.VOCAB_SAVE, (event, item) => {
    const start = Date.now();
    try {
      const res = vocabRepo.save(item);
      logIpcCall(IPC_CHANNELS.VOCAB_SAVE, start, true);
      return res;
    } catch (err) {
      logIpcCall(IPC_CHANNELS.VOCAB_SAVE, start, false, err);
      throw err;
    }
  });

  ipcMain.handle(IPC_CHANNELS.VOCAB_DELETE, (event, id: number) => {
    const start = Date.now();
    try {
      const res = vocabRepo.delete(id);
      logIpcCall(IPC_CHANNELS.VOCAB_DELETE, start, true);
      return res;
    } catch (err) {
      logIpcCall(IPC_CHANNELS.VOCAB_DELETE, start, false, err);
      throw err;
    }
  });

  // Flashcards & SRS Handlers
  ipcMain.handle(IPC_CHANNELS.FLASHCARD_GET_DUE, (event, limit?: number) => {
    return flashcardRepo.getDueCards(limit);
  });

  ipcMain.handle(IPC_CHANNELS.FLASHCARD_REVIEW, (event, { cardId, rating }) => {
    const start = Date.now();
    try {
      const res = flashcardRepo.review(cardId, rating);
      logIpcCall(IPC_CHANNELS.FLASHCARD_REVIEW, start, true);
      return res;
    } catch (err) {
      logIpcCall(IPC_CHANNELS.FLASHCARD_REVIEW, start, false, err);
      throw err;
    }
  });

  ipcMain.handle(IPC_CHANNELS.FLASHCARD_GET_STATS, () => {
    return flashcardRepo.getStats();
  });

  // Translation & OCR Handlers
  ipcMain.handle(IPC_CHANNELS.TRANSLATE_TEXT, async (event, request) => {
    const result = await transManager.translate(request);
    // Save to history
    historyRepo.saveItem({
      sourceText: result.sourceText,
      sourceLang: result.sourceLang,
      targetText: result.translatedText,
      targetLang: result.targetLang,
      pinyin: result.pinyin,
      sourceType: 'manual',
      provider: result.provider,
    });
    return result;
  });

  ipcMain.handle(IPC_CHANNELS.TRANSLATE_DETECT, async (event, text: string) => {
    return await transManager.detectLanguage(text);
  });

  ipcMain.handle(IPC_CHANNELS.OCR_PROCESS_IMAGE, async (event, imageBuffer: string) => {
    return await ocrManager.recognize(imageBuffer);
  });

  // Text To Speech (TTS) Handler
  ipcMain.handle(IPC_CHANNELS.TTS_SYNTHESIZE, async (event, request) => {
    return await ttsService.synthesize(request);
  });

  // Speech To Text (STT) & Realtime Voice Translation Handler
  ipcMain.handle(IPC_CHANNELS.VOICE_TRANSCRIBE, async (event, request) => {
    return await sttService.transcribeAndTranslate(request);
  });

  // Translation History Handlers
  ipcMain.handle(IPC_CHANNELS.HISTORY_GET, (event, limit?: number) => {
    return historyRepo.getHistory(limit);
  });

  ipcMain.handle(IPC_CHANNELS.HISTORY_SAVE, (event, item) => {
    return historyRepo.saveItem(item);
  });

  ipcMain.handle(IPC_CHANNELS.HISTORY_CLEAR, () => {
    historyRepo.clear();
    return true;
  });

  // Statistics Handlers
  ipcMain.handle(IPC_CHANNELS.STATS_GET, () => {
    return {
      history: statsRepo.getStats(14),
      summary: statsRepo.getSummary(),
    };
  });

  ipcMain.handle(IPC_CHANNELS.STATS_RECORD_SESSION, (event, { type, minutes }) => {
    statsRepo.recordStudyTime(type, minutes);
    return true;
  });

  // AI & Analysis Handlers
  ipcMain.handle(IPC_CHANNELS.AI_ANALYZE_SENTENCE, async (event, { sentence, targetLang, nativeLang }) => {
    return await aiManager.analyzeSentence(sentence, targetLang, nativeLang);
  });

  ipcMain.handle(IPC_CHANNELS.AI_EXPLAIN_GRAMMAR, async (event, { text, point }) => {
    return await aiManager.explainGrammar(text, point);
  });

  ipcMain.handle(IPC_CHANNELS.AI_CONVERSATION_CHAT, async (event, { messages, topic, level }) => {
    return await aiManager.chat(messages, { topic, level });
  });

  ipcMain.handle(IPC_CHANNELS.AI_EVALUATE_SPEECH, async (event, { targetText, spokenText, lang }) => {
    return await aiManager.evaluateSpeech(targetText, spokenText, lang);
  });

  // Subtitle Handlers
  ipcMain.on(IPC_CHANNELS.SUBTITLE_NEW_ENTRY, (event, entry) => {
    SubtitleWindowManager.getInstance().sendSubtitle(entry, false);
  });

  ipcMain.handle('subtitle:broadcast', async (event, entry, autoShow?: boolean) => {
    await SubtitleWindowManager.getInstance().sendSubtitle(entry, autoShow ?? false);
    return true;
  });

  ipcMain.handle('subtitle:get-current', () => {
    return SubtitleWindowManager.getInstance().getCurrentEntry();
  });

  ipcMain.handle('subtitle:is-open', () => {
    return SubtitleWindowManager.getInstance().isOpen();
  });

  ipcMain.handle('subtitle:show', async () => {
    await SubtitleWindowManager.getInstance().showWindow();
    return true;
  });

  ipcMain.handle('subtitle:hide', () => {
    SubtitleWindowManager.getInstance().hideWindow();
    return true;
  });

  ipcMain.handle('subtitle:toggle', async () => {
    return await SubtitleWindowManager.getInstance().toggleWindow();
  });

  ipcMain.on('subtitle:open-overlay', () => {
    SubtitleWindowManager.getInstance().toggleWindow();
  });
}
