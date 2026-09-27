import { BrowserWindow, screen, app } from 'electron';
import path from 'path';
import { IPC_CHANNELS } from '../../shared/constants/ipc';

export interface SubtitleDataEntry {
  original: string;
  pinyin?: string;
  translation: string;
}

export class SubtitleWindowManager {
  private static instance: SubtitleWindowManager | null = null;
  private window: BrowserWindow | null = null;
  private currentEntry: SubtitleDataEntry | null = null;

  public static getInstance(): SubtitleWindowManager {
    if (!SubtitleWindowManager.instance) {
      SubtitleWindowManager.instance = new SubtitleWindowManager();
    }
    return SubtitleWindowManager.instance;
  }

  public getWindow(): BrowserWindow | null {
    return this.window;
  }

  public isOpen(): boolean {
    return Boolean(this.window && !this.window.isDestroyed() && this.window.isVisible());
  }

  public getCurrentEntry(): SubtitleDataEntry | null {
    return this.currentEntry;
  }

  public async showWindow(): Promise<void> {
    if (!this.window || this.window.isDestroyed()) {
      await this.createWindow();
      return;
    }
    if (!this.window.isVisible()) {
      this.window.show();
    }
    this.window.focus();
    if (this.currentEntry) {
      this.window.webContents.send(IPC_CHANNELS.EVENT_SUBTITLE_DATA, this.currentEntry);
    }
  }

  public hideWindow(): void {
    if (this.window && !this.window.isDestroyed() && this.window.isVisible()) {
      this.window.hide();
    }
  }

  public async toggleWindow(): Promise<boolean> {
    if (this.window && !this.window.isDestroyed()) {
      if (this.window.isVisible()) {
        this.window.hide();
        return false;
      } else {
        this.window.show();
        this.window.focus();
        if (this.currentEntry) {
          this.window.webContents.send(IPC_CHANNELS.EVENT_SUBTITLE_DATA, this.currentEntry);
        }
        return true;
      }
    }
    await this.createWindow();
    return true;
  }

  public async createWindow(): Promise<BrowserWindow> {
    if (this.window && !this.window.isDestroyed()) {
      this.window.show();
      this.window.focus();
      return this.window;
    }

    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    const primaryDisplay = screen.getPrimaryDisplay();
    const bounds = primaryDisplay.workArea;

    const width = Math.min(880, Math.max(520, Math.round(bounds.width * 0.6)));
    const height = 180;
    const x = Math.round((bounds.width - width) / 2);
    const y = Math.round(bounds.height - height - 50);

    this.window = new BrowserWindow({
      width,
      height,
      minWidth: 400,
      minHeight: 110,
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

    this.window.setAlwaysOnTop(true, 'floating');

    const targetUrl = isDev 
      ? 'http://localhost:5173/#/subtitle'
      : `file://${path.join(__dirname)}../../dist/index.html#/subtitle`;

    const normalizedUrl = isDev 
      ? 'http://localhost:5173/#/subtitle'
      : `file://${path.join(__dirname, '../../dist/index.html')}#/subtitle`;

    await this.window.loadURL(normalizedUrl);

    if (this.window && !this.window.isDestroyed()) {
      if (this.currentEntry) {
        this.window.webContents.send(IPC_CHANNELS.EVENT_SUBTITLE_DATA, this.currentEntry);
      }
      this.window.show();
    }

    this.window.on('closed', () => {
      this.window = null;
    });

    return this.window;
  }

  public async sendSubtitle(entry: SubtitleDataEntry, autoShow: boolean = false): Promise<void> {
    this.currentEntry = entry;

    if (!this.window || this.window.isDestroyed()) {
      if (autoShow) {
        await this.createWindow();
        if (this.window && !this.window.isDestroyed()) {
          this.window.webContents.send(IPC_CHANNELS.EVENT_SUBTITLE_DATA, entry);
        }
      }
      return;
    }

    if (!this.window.isVisible() && autoShow) {
      this.window.show();
    }

    this.window.webContents.send(IPC_CHANNELS.EVENT_SUBTITLE_DATA, entry);
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
