import { globalShortcut, app } from 'electron';
import { SnipWindowManager } from '../windows/snipWindow';
import { SubtitleWindowManager } from '../windows/subtitleWindow';
import { MainWindowManager } from '../windows/mainWindow';

export interface ShortcutConfig {
  screenTranslate?: string;
  ocrCapture?: string;
  clipboardTranslate?: string;
  liveVoice?: string;
  subtitleMode?: string;
}

export class ShortcutService {
  private static instance: ShortcutService | null = null;
  private currentShortcuts: ShortcutConfig = {};

  public static getInstance(): ShortcutService {
    if (!ShortcutService.instance) {
      ShortcutService.instance = new ShortcutService();
    }
    return ShortcutService.instance;
  }

  public registerShortcuts(config: ShortcutConfig): void {
    globalShortcut.unregisterAll();
    this.currentShortcuts = config;

    const screenKey = config.screenTranslate || 'CommandOrControl+Shift+T';
    const ocrKey = config.ocrCapture || 'CommandOrControl+Shift+O';
    const subKey = config.subtitleMode || 'CommandOrControl+Shift+S';
    const voiceKey = config.liveVoice || 'CommandOrControl+Shift+L';

    // Screen Translate hotkey
    try {
      globalShortcut.register(screenKey, () => {
        console.log('[Shortcut] Screen Translate triggered:', screenKey);
        SnipWindowManager.getInstance().startSnip();
      });
    } catch (e) {
      console.warn(`[Shortcut] Failed to register screenTranslate shortcut (${screenKey}):`, e);
    }

    // OCR Capture hotkey
    try {
      globalShortcut.register(ocrKey, () => {
        console.log('[Shortcut] OCR Capture triggered:', ocrKey);
        SnipWindowManager.getInstance().startSnip();
      });
    } catch (e) {
      console.warn(`[Shortcut] Failed to register ocrCapture shortcut (${ocrKey}):`, e);
    }

    // Subtitle Mode hotkey
    try {
      globalShortcut.register(subKey, () => {
        console.log('[Shortcut] Subtitle Mode triggered:', subKey);
        SubtitleWindowManager.getInstance().toggleWindow();
      });
    } catch (e) {
      console.warn(`[Shortcut] Failed to register subtitleMode shortcut (${subKey}):`, e);
    }

    // Live Voice hotkey
    try {
      globalShortcut.register(voiceKey, () => {
        console.log('[Shortcut] Live Voice triggered:', voiceKey);
        const win = MainWindowManager.getInstance().getWindow();
        if (win) {
          win.show();
          win.focus();
          win.webContents.send('route:navigate', '/voice');
        }
      });
    } catch (e) {
      console.warn(`[Shortcut] Failed to register liveVoice shortcut (${voiceKey}):`, e);
    }
  }

  public unregisterAll(): void {
    globalShortcut.unregisterAll();
  }
}
