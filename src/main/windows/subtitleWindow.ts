import { BrowserWindow, screen, app } from 'electron';
import path from 'path';
import { IPC_CHANNELS } from '../../shared/constants/ipc';

export class SubtitleWindowManager {
  private static instance: SubtitleWindowManager | null = null;
  private window: BrowserWindow | null = null;

  public static getInstance(): SubtitleWindowManager {
    if (!SubtitleWindowManager.instance) {
      SubtitleWindowManager.instance = new SubtitleWindowManager();
    }
    return SubtitleWindowManager.instance;
  }

  public getWindow(): BrowserWindow | null {
    return this.window;
  }

  public async toggleWindow(): Promise<void> {
    if (this.window && !this.window.isDestroyed()) {
      if (this.window.isVisible()) {
        this.window.hide();
      } else {
        this.window.show();
      }
      return;
    }
    await this.createWindow();
  }

  public async createWindow(): Promise<BrowserWindow> {
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    const primaryDisplay = screen.getPrimaryDisplay();
    const bounds = primaryDisplay.workArea;

    const width = 840;
    const height = 180;
    const x = Math.round((bounds.width - width) / 2);
    const y = Math.round(bounds.height - height - 60);

    this.window = new BrowserWindow({
      width,
      height,
      minWidth: 400,
      minHeight: 100,
      x,
      y,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      alwaysOnTop: true,
      skipTaskbar: false,
      resizable: true,
      hasShadow: false,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    this.window.setAlwaysOnTop(true, 'screen-saver');

    const targetUrl = isDev 
      ? 'http://localhost:5173/#/subtitle'
      : `file://${path.join(__dirname, '../../dist/index.html')}#/subtitle`;

    await this.window.loadURL(targetUrl);

    this.window.on('closed', () => {
      this.window = null;
    });

    return this.window;
  }

  public sendSubtitle(entry: { original: string; pinyin?: string; translation: string }): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(IPC_CHANNELS.EVENT_SUBTITLE_DATA, entry);
    }
  }

  public setClickThrough(enable: boolean): void {
    if (!this.window || this.window.isDestroyed()) return;
    if (enable) {
      this.window.setIgnoreMouseEvents(true, { forward: true });
    } else {
      this.window.setIgnoreMouseEvents(false);
    }
  }

  public setOpacity(opacity: number): void {
    this.window?.setOpacity(Math.max(0.2, Math.min(1.0, opacity)));
  }

  public close(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.close();
      this.window = null;
    }
  }
}
