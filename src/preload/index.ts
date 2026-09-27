import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/constants/ipc';
import { 
  TranslationRequest, 
  TranslationResponse, 
  VocabularyItem, 
  FlashcardRating, 
  AppSettings,
  OCRResult 
} from '../shared/types';

export const electronAPI = {
  // App & Windows
  getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
  minimize: () => ipcRenderer.send(IPC_CHANNELS.APP_MINIMIZE),
  maximize: () => ipcRenderer.send(IPC_CHANNELS.APP_MAXIMIZE),
  close: () => ipcRenderer.send(IPC_CHANNELS.APP_CLOSE),

  // Overlay / Subtitle window controls
  setAlwaysOnTop: (flag: boolean) => ipcRenderer.send(IPC_CHANNELS.WINDOW_SET_ALWAYS_ON_TOP, flag),
  setClickThrough: (flag: boolean) => ipcRenderer.send(IPC_CHANNELS.WINDOW_SET_CLICK_THROUGH, flag),
  setOpacity: (opacity: number) => ipcRenderer.send(IPC_CHANNELS.WINDOW_SET_OPACITY, opacity),
  triggerSnip: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_TRIGGER_SNIP),
  completeSnip: (rect: { x: number; y: number; width: number; height: number }) => 
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_COMPLETE_SNIP, rect),
  cancelSnip: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CANCEL_SNIP),

  // Settings & Theme
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
  saveSettings: (settings: Partial<AppSettings>): Promise<AppSettings> => 
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SAVE, settings),
  setThemeMode: (mode: 'dark' | 'light' | 'system'): Promise<{ theme: string; effectiveTheme: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.THEME_CHANGE, mode),
  getThemeMode: (): Promise<{ theme: string; effectiveTheme: string; subtitleTheme?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.THEME_GET),

  // Vocabulary
  getVocabulary: (language?: string): Promise<VocabularyItem[]> => 
    ipcRenderer.invoke(IPC_CHANNELS.VOCAB_GET_ALL, language),
  getVocabularyById: (id: number): Promise<VocabularyItem | null> => 
    ipcRenderer.invoke(IPC_CHANNELS.VOCAB_GET_BY_ID, id),
  searchVocabulary: (query: string): Promise<VocabularyItem[]> => 
    ipcRenderer.invoke(IPC_CHANNELS.VOCAB_SEARCH, query),
  saveVocabulary: (item: VocabularyItem): Promise<VocabularyItem> => 
    ipcRenderer.invoke(IPC_CHANNELS.VOCAB_SAVE, item),
  deleteVocabulary: (id: number): Promise<boolean> => 
    ipcRenderer.invoke(IPC_CHANNELS.VOCAB_DELETE, id),

  // Flashcards & SRS
  getDueFlashcards: (limit?: number) => ipcRenderer.invoke(IPC_CHANNELS.FLASHCARD_GET_DUE, limit),
  reviewFlashcard: (cardId: number, rating: FlashcardRating) => 
    ipcRenderer.invoke(IPC_CHANNELS.FLASHCARD_REVIEW, { cardId, rating }),
  getFlashcardStats: () => ipcRenderer.invoke(IPC_CHANNELS.FLASHCARD_GET_STATS),

  // Translation, OCR & TTS
  translate: (request: TranslationRequest): Promise<TranslationResponse> => 
    ipcRenderer.invoke(IPC_CHANNELS.TRANSLATE_TEXT, request),
  detectLanguage: (text: string) => ipcRenderer.invoke(IPC_CHANNELS.TRANSLATE_DETECT, text),
  processOcrImage: (imageBuffer: string): Promise<OCRResult> => 
    ipcRenderer.invoke(IPC_CHANNELS.OCR_PROCESS_IMAGE, imageBuffer),
  synthesizeSpeech: (params: { text: string; lang?: string; slow?: boolean }): Promise<{
    success: boolean;
    audioData?: string;
    format?: string;
    lang?: string;
    cached?: boolean;
    error?: string;
  }> => ipcRenderer.invoke(IPC_CHANNELS.TTS_SYNTHESIZE, params),
  transcribeAudio: (params: {
    audioData: string;
    mimeType?: string;
    sourceLang?: string;
    targetLang?: string;
  }): Promise<{
    success: boolean;
    transcript?: string;
    translation?: string;
    pinyin?: string;
    error?: string;
    errorCode?: 'NO_API_KEY' | 'STT_FAILED' | 'NETWORK_ERROR' | 'INVALID_AUDIO';
  }> => ipcRenderer.invoke(IPC_CHANNELS.VOICE_TRANSCRIBE, params),

  // History & Statistics
  getHistory: (limit?: number) => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_GET, limit),
  clearHistory: () => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_CLEAR),
  getStatistics: () => ipcRenderer.invoke(IPC_CHANNELS.STATS_GET),
  recordStudySession: (type: 'chinese' | 'english' | 'listening' | 'speaking', minutes: number) => 
    ipcRenderer.invoke(IPC_CHANNELS.STATS_RECORD_SESSION, { type, minutes }),

  // AI & Linguistic Analysis
  analyzeSentence: (params: { sentence: string; targetLang?: string; nativeLang?: string }) => 
    ipcRenderer.invoke(IPC_CHANNELS.AI_ANALYZE_SENTENCE, params),
  explainGrammar: (params: { text: string; point?: string }) => 
    ipcRenderer.invoke(IPC_CHANNELS.AI_EXPLAIN_GRAMMAR, params),
  chatWithAiTutor: (params: { messages: Array<{ role: string; content: string }>; topic?: string; level?: string }) => 
    ipcRenderer.invoke(IPC_CHANNELS.AI_CONVERSATION_CHAT, params),
  evaluateSpeech: (params: { targetText: string; spokenText: string; lang: string }) => 
    ipcRenderer.invoke(IPC_CHANNELS.AI_EVALUATE_SPEECH, params),

  // Subtitles
  sendSubtitleEntry: (entry: { original: string; pinyin?: string; translation: string }, autoShow?: boolean) => 
    ipcRenderer.invoke('subtitle:broadcast', entry, autoShow),
  openSubtitleOverlay: () => ipcRenderer.invoke('subtitle:show'),
  toggleSubtitleOverlay: (): Promise<boolean> => ipcRenderer.invoke('subtitle:toggle'),
  hideSubtitleOverlay: () => ipcRenderer.invoke('subtitle:hide'),
  isSubtitleOverlayOpen: (): Promise<boolean> => ipcRenderer.invoke('subtitle:is-open'),
  getCurrentSubtitle: (): Promise<{ original: string; pinyin?: string; translation: string } | null> => 
    ipcRenderer.invoke('subtitle:get-current'),

  // Event Listeners (Main -> Renderer)
  onClipboardText: (callback: (text: string) => void) => {
    const handler = (_: any, text: string) => callback(text);
    ipcRenderer.on(IPC_CHANNELS.EVENT_CLIPBOARD_TEXT, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.EVENT_CLIPBOARD_TEXT, handler);
    };
  },
  onOverlayData: (callback: (data: TranslationResponse) => void) => {
    const handler = (_: any, data: TranslationResponse) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.EVENT_OVERLAY_DATA, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.EVENT_OVERLAY_DATA, handler);
    };
  },
  onSubtitleData: (callback: (data: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.EVENT_SUBTITLE_DATA, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.EVENT_SUBTITLE_DATA, handler);
    };
  },
  onSnipStart: (callback: (data: { screenshotUrl: string; displayWidth: number; displayHeight: number }) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.EVENT_SNIP_START, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.EVENT_SNIP_START, handler);
    };
  },
  onNavigate: (callback: (route: string) => void) => {
    const handler = (_: any, route: string) => callback(route);
    ipcRenderer.on('route:navigate', handler);
    return () => {
      ipcRenderer.removeListener('route:navigate', handler);
    };
  },
  onThemeUpdated: (callback: (payload: { theme: 'dark' | 'light' | 'system'; effectiveTheme: 'dark' | 'light'; subtitleTheme?: string }) => void) => {
    const handler = (_: any, payload: any) => callback(payload);
    ipcRenderer.on(IPC_CHANNELS.EVENT_THEME_UPDATED, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.EVENT_THEME_UPDATED, handler);
    };
  },

  // Production-Grade Logging & Monitoring
  logger: {
    trace: (message: string, context?: any) =>
      ipcRenderer.invoke(IPC_CHANNELS.LOGS_CREATE, { level: 'trace', message, source: 'renderer', ...context }),
    debug: (message: string, context?: any) =>
      ipcRenderer.invoke(IPC_CHANNELS.LOGS_CREATE, { level: 'debug', message, source: 'renderer', ...context }),
    info: (message: string, context?: any) =>
      ipcRenderer.invoke(IPC_CHANNELS.LOGS_CREATE, { level: 'info', message, source: 'renderer', ...context }),
    warn: (message: string, context?: any) =>
      ipcRenderer.invoke(IPC_CHANNELS.LOGS_CREATE, { level: 'warn', message, source: 'renderer', ...context }),
    error: (message: string, context?: any) =>
      ipcRenderer.invoke(IPC_CHANNELS.LOGS_CREATE, { level: 'error', message, source: 'renderer', ...context }),
    fatal: (message: string, context?: any) =>
      ipcRenderer.invoke(IPC_CHANNELS.LOGS_CREATE, { level: 'fatal', message, source: 'renderer', ...context }),
  },
  getLogs: (filter?: any) => ipcRenderer.invoke(IPC_CHANNELS.LOGS_LIST, filter),
  getLogById: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.LOGS_GET, id),
  getLogStats: (timeRange?: any) => ipcRenderer.invoke(IPC_CHANNELS.LOGS_STATS, timeRange),
  clearLogs: (options?: any) => ipcRenderer.invoke(IPC_CHANNELS.LOGS_CLEAR, options),
  deleteLogsOlderThan: (days: number) => ipcRenderer.invoke(IPC_CHANNELS.LOGS_DELETE_OLDER_THAN, days),
  exportLogs: (options: any) => ipcRenderer.invoke(IPC_CHANNELS.LOGS_EXPORT, options),
  getLogConfig: () => ipcRenderer.invoke(IPC_CHANNELS.LOGS_GET_CONFIG),
  updateLogConfig: (config: any) => ipcRenderer.invoke(IPC_CHANNELS.LOGS_UPDATE_CONFIG, config),
  onNewLog: (callback: (log: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.EVENT_LOG_NEW, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.EVENT_LOG_NEW, handler);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
contextBridge.exposeInMainWorld('electron', { logger: electronAPI.logger });
