export const DB_SCHEMA_SQL = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  native_language TEXT NOT NULL DEFAULT 'vi',
  target_primary TEXT NOT NULL DEFAULT 'zh',
  target_secondary TEXT NOT NULL DEFAULT 'en',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Languages table
CREATE TABLE IF NOT EXISTS languages (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  native_name TEXT NOT NULL
);

-- Vocabulary table
CREATE TABLE IF NOT EXISTS vocabulary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL,
  language TEXT NOT NULL,
  translation TEXT NOT NULL,
  pinyin TEXT,
  ipa TEXT,
  part_of_speech TEXT,
  definition TEXT,
  difficulty INTEGER DEFAULT 1,
  hsk_level INTEGER,
  cefr_level TEXT,
  source TEXT DEFAULT 'manual',
  notes TEXT,
  ease_factor REAL DEFAULT 2.5,
  repetition_count INTEGER DEFAULT 0,
  interval_days INTEGER DEFAULT 0,
  last_reviewed_at DATETIME,
  next_review_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(word, language)
);

-- Vocabulary Examples
CREATE TABLE IF NOT EXISTS vocabulary_examples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vocabulary_id INTEGER NOT NULL,
  sentence TEXT NOT NULL,
  pinyin TEXT,
  translation TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vocabulary_id) REFERENCES vocabulary (id) ON DELETE CASCADE
);

-- Flashcards for Spaced Repetition (SM-2)
CREATE TABLE IF NOT EXISTS flashcards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vocabulary_id INTEGER NOT NULL UNIQUE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  pinyin TEXT,
  note TEXT,
  state TEXT DEFAULT 'new', -- 'new', 'learning', 'review', 'mastered'
  interval INTEGER DEFAULT 0,
  ease_factor REAL DEFAULT 2.5,
  reps INTEGER DEFAULT 0,
  lapses INTEGER DEFAULT 0,
  due DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vocabulary_id) REFERENCES vocabulary (id) ON DELETE CASCADE
);

-- Review Log History
CREATE TABLE IF NOT EXISTS review_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flashcard_id INTEGER NOT NULL,
  rating INTEGER NOT NULL, -- 1: Again, 2: Hard, 3: Good, 4: Easy
  review_time INTEGER DEFAULT 0,
  elapsed_days REAL DEFAULT 0,
  scheduled_days INTEGER DEFAULT 0,
  review_type TEXT DEFAULT 'spaced_repetition',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (flashcard_id) REFERENCES flashcards (id) ON DELETE CASCADE
);

-- Translation History
CREATE TABLE IF NOT EXISTS translation_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_text TEXT NOT NULL,
  source_lang TEXT NOT NULL,
  target_text TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  pinyin TEXT,
  source_type TEXT NOT NULL DEFAULT 'manual',
  provider TEXT NOT NULL DEFAULT 'google_free',
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- OCR History
CREATE TABLE IF NOT EXISTS ocr_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_data_url TEXT,
  recognized_text TEXT NOT NULL,
  detected_lang TEXT,
  translation TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Subtitle Sessions
CREATE TABLE IF NOT EXISTS subtitle_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  media_type TEXT DEFAULT 'live',
  duration INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Subtitle Entries
CREATE TABLE IF NOT EXISTS subtitle_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER,
  start_time INTEGER NOT NULL,
  end_time INTEGER NOT NULL,
  original_text TEXT NOT NULL,
  pinyin TEXT,
  translation_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES subtitle_sessions (id) ON DELETE CASCADE
);

-- AI Conversation Sessions
CREATE TABLE IF NOT EXISTS conversation_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  topic TEXT DEFAULT 'casual',
  target_lang TEXT NOT NULL DEFAULT 'zh',
  difficulty TEXT DEFAULT 'intermediate',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI Conversation Messages
CREATE TABLE IF NOT EXISTS conversation_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  role TEXT NOT NULL, -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,
  pinyin TEXT,
  translation TEXT,
  feedback TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES conversation_sessions (id) ON DELETE CASCADE
);

-- Learning Statistics (Daily aggregations)
CREATE TABLE IF NOT EXISTS learning_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT UNIQUE NOT NULL,
  words_learned INTEGER DEFAULT 0,
  words_reviewed INTEGER DEFAULT 0,
  listening_minutes INTEGER DEFAULT 0,
  speaking_minutes INTEGER DEFAULT 0,
  study_minutes_chinese INTEGER DEFAULT 0,
  study_minutes_english INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- App Settings Key-Value Store
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;
