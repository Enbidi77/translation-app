export const IPC_CHANNELS = {
  // App & Windows
  APP_GET_VERSION: 'app:get-version',
  APP_MINIMIZE: 'app:minimize',
  APP_MAXIMIZE: 'app:maximize',
  APP_CLOSE: 'app:close',
  WINDOW_OPEN_OVERLAY: 'window:open-overlay',
  WINDOW_CLOSE_OVERLAY: 'window:close-overlay',
  WINDOW_SET_ALWAYS_ON_TOP: 'window:set-always-on-top',
  WINDOW_SET_CLICK_THROUGH: 'window:set-click-through',
  WINDOW_SET_OPACITY: 'window:set-opacity',
  WINDOW_TRIGGER_SNIP: 'window:trigger-snip',
  WINDOW_COMPLETE_SNIP: 'window:complete-snip',
  WINDOW_CANCEL_SNIP: 'window:cancel-snip',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SAVE: 'settings:save',

  // Database / Vocabulary
  VOCAB_GET_ALL: 'vocab:get-all',
  VOCAB_GET_BY_ID: 'vocab:get-by-id',
  VOCAB_SAVE: 'vocab:save',
  VOCAB_DELETE: 'vocab:delete',
  VOCAB_SEARCH: 'vocab:search',

  // Flashcards & SRS
  FLASHCARD_GET_DUE: 'flashcard:get-due',
  FLASHCARD_REVIEW: 'flashcard:review',
  FLASHCARD_GET_STATS: 'flashcard:get-stats',

  // Translation & OCR
  TRANSLATE_TEXT: 'translate:text',
  TRANSLATE_DETECT: 'translate:detect',
  OCR_PROCESS_IMAGE: 'ocr:process-image',
  OCR_PROCESS_RECT: 'ocr:process-rect',

  // History
  HISTORY_GET: 'history:get',
  HISTORY_SAVE: 'history:save',
  HISTORY_CLEAR: 'history:clear',

  // Statistics
  STATS_GET: 'stats:get',
  STATS_RECORD_SESSION: 'stats:record-session',

  // AI & Analysis
  AI_ANALYZE_SENTENCE: 'ai:analyze-sentence',
  AI_EXPLAIN_GRAMMAR: 'ai:explain-grammar',
  AI_CONVERSATION_CHAT: 'ai:conversation-chat',
  AI_EVALUATE_SPEECH: 'ai:evaluate-speech',

  // Subtitles
  SUBTITLE_SESSION_START: 'subtitle:start',
  SUBTITLE_SESSION_STOP: 'subtitle:stop',
  SUBTITLE_NEW_ENTRY: 'subtitle:new-entry',

  // Events from Main to Renderer
  EVENT_CLIPBOARD_TEXT: 'event:clipboard-text',
  EVENT_GLOBAL_SHORTCUT: 'event:global-shortcut',
  EVENT_OVERLAY_DATA: 'event:overlay-data',
  EVENT_SUBTITLE_DATA: 'event:subtitle-data',
  EVENT_SNIP_START: 'event:snip-start',
} as const;
