import { BrowserWindow, screen, app } from 'electron';
import path from 'path';
import { IPC_CHANNELS } from '../../shared/constants/ipc';

export class SnipWindowManager {
  private static instance: SnipWindowManager | null = null;
  private window: BrowserWindow | null = null;

  public static getInstance(): SnipWindowManager {
    if (!SnipWindowManager.instance) {
      SnipWindowManager.instance = new SnipWindowManager();
    }
    return SnipWindowManager.instance;
  }

  public getWindow(): BrowserWindow | null {
    return this.window;
  }

  public async startSnip(): Promise<void> {
    if (this.window && !this.window.isDestroyed()) {
      this.window.close();
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.bounds;

    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

    this.window = new BrowserWindow({
      x: primaryDisplay.bounds.x,
      y: primaryDisplay.bounds.y,
      width,
      height,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      enableLargerThanScreen: true,
      hasShadow: false,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    this.window.setAlwaysOnTop(true, 'screen-saver');

    const targetUrl = isDev 
      ? 'http://localhost:5173/#/snip'
      : `file://${path.join(__dirname, '../../dist/index.html')}#/snip`;

    await this.window.loadURL(targetUrl);

    this.window.webContents.once('did-finish-load', () => {
      this.window?.webContents.send(IPC_CHANNELS.EVENT_SNIP_START, {
        displayWidth: width,
        displayHeight: height,
      });
      this.window?.show();
      this.window?.focus();
    });

    this.window.on('closed', () => {
      this.window = null;
    });
  }

  public close(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.close();
      this.window = null;
    }
  }
}
