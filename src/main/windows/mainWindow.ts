import { BrowserWindow, app } from 'electron';
import path from 'path';

export class MainWindowManager {
  private static instance: MainWindowManager | null = null;
  private window: BrowserWindow | null = null;

  public static getInstance(): MainWindowManager {
    if (!MainWindowManager.instance) {
      MainWindowManager.instance = new MainWindowManager();
    }
    return MainWindowManager.instance;
  }

  public getWindow(): BrowserWindow | null {
    return this.window;
  }

  public createWindow(): BrowserWindow {
    if (this.window && !this.window.isDestroyed()) {
      this.window.show();
      this.window.focus();
      return this.window;
    }

    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

    this.window = new BrowserWindow({
      width: 1280,
      height: 840,
      minWidth: 1024,
      minHeight: 680,
      title: 'PolyglotDesktop - Trợ Lý Học Tiếng Trung & Tiếng Anh',
      backgroundColor: '#202124',
      frame: false,
      titleBarStyle: 'hidden',
      show: false,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    });

    if (isDev) {
      this.window.loadURL('http://localhost:5173');
      // this.window.webContents.openDevTools();
    } else {
      this.window.loadFile(path.join(__dirname, '../../dist/index.html'));
    }

    this.window.once('ready-to-show', () => {
      this.window?.show();
    });

    this.window.on('closed', () => {
      this.window = null;
    });

    return this.window;
  }
}
