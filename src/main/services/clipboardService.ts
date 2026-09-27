import { clipboard, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/ipc';

export class ClipboardService {
  private static instance: ClipboardService | null = null;
  private intervalTimer: NodeJS.Timeout | null = null;
  private lastText: string = '';
  private enabled: boolean = true;

  public static getInstance(): ClipboardService {
    if (!ClipboardService.instance) {
      ClipboardService.instance = new ClipboardService();
    }
    return ClipboardService.instance;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public async startWatching(getTargetWindow: () => BrowserWindow | null): Promise<void> {
    if (this.intervalTimer) return;

    try {
      const text = await Promise.resolve(clipboard.readText());
      this.lastText = (text || '').trim();
    } catch {}

    this.intervalTimer = setInterval(async () => {
      if (!this.enabled) return;

      try {
        const text = await Promise.resolve(clipboard.readText());
        const current = (text || '').trim();
        if (current && current !== this.lastText && current.length <= 500) {
          this.lastText = current;

          // Check if Chinese or contains non-trivial words
          const isZh = /[\u4e00-\u9fa5]/.test(current);
          const isEn = /^[a-zA-Z\s,.'"-]{2,}$/.test(current);

          if (isZh || isEn) {
            const win = getTargetWindow();
            if (win && !win.isDestroyed()) {
              win.webContents.send(IPC_CHANNELS.EVENT_CLIPBOARD_TEXT, current);
            }
          }
        }
      } catch (err) {
        console.warn('[ClipboardService] Read error:', err);
      }
    }, 800);
  }

  public stopWatching(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }
}
