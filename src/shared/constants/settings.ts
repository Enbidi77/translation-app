import { AppSettings } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  general: {
    nativeLanguage: 'vi',
    primaryTarget: 'zh',
    secondaryTarget: 'en',
    theme: 'dark',
    startAtLogin: false,
    minimizeToTray: true,
    enableClipboardWatcher: true,
  },
  pinyin: {
    displayMode: 'always',
    toneStyle: 'marks',
  },
  hotkeys: {
    screenTranslate: 'CommandOrControl+Shift+T',
    ocrCapture: 'CommandOrControl+Shift+O',
    clipboardTranslate: 'CommandOrControl+Shift+V',
    liveVoice: 'CommandOrControl+Shift+L',
    subtitleMode: 'CommandOrControl+Shift+S',
  },
  providers: {
    translationProvider: 'google_free',
    ocrProvider: 'tesseract',
    aiProvider: 'gemini',
    ttsProvider: 'google',
    sttProvider: 'system',
    geminiApiKey: '',
    geminiModel: 'gemini-1.5-flash',
    openaiApiKey: '',
    openaiModel: 'gpt-4o-mini',
    deeplApiKey: '',
  },
  subtitles: {
    fontSize: 22,
    opacity: 0.9,
    alwaysOnTop: true,
    clickThrough: false,
    showPinyin: true,
    textColor: '#ffffff',
    backgroundColor: '#0f172a',
    maxLines: 2,
    subtitleTheme: 'follow_app',
  },
};
