import { BrowserWindow, screen, app } from 'electron';
import path from 'path';
import { IPC_CHANNELS } from '../../shared/constants/ipc';
import { TranslationResponse } from '../../shared/types';

export class OverlayWindowManager {
  private static instance: OverlayWindowManager | null = null;
  private window: BrowserWindow | null = null;
  private currentData: TranslationResponse | null = null;

  public static getInstance(): OverlayWindowManager {
    if (!OverlayWindowManager.instance) {
      OverlayWindowManager.instance = new OverlayWindowManager();
    }
    return OverlayWindowManager.instance;
  }

  public getWindow(): BrowserWindow | null {
    return this.window;
  }

  public async showWithData(data: TranslationResponse, nearCoords?: { x: number; y: number; width?: number; height?: number }): Promise<void> {
    this.currentData = data;

    if (!this.window || this.window.isDestroyed()) {
      await this.createWindow(nearCoords);
    } else {
      if (nearCoords) {
        this.positionWindow(nearCoords);
      }
      this.window.show();
      this.window.focus();
    }

    this.window?.webContents.send(IPC_CHANNELS.EVENT_OVERLAY_DATA, data);
  }

  private async createWindow(nearCoords?: { x: number; y: number; width?: number; height?: number }): Promise<void> {
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

    let x: number | undefined;
    let y: number | undefined;

    if (nearCoords) {
      const primaryDisplay = screen.getPrimaryDisplay();
      const bounds = primaryDisplay.workArea;
      x = Math.min(bounds.width - 500, Math.max(20, nearCoords.x));
      y = Math.min(bounds.height - 400, Math.max(20, (nearCoords.y + (nearCoords.height || 0) + 15)));
    }

    this.window = new BrowserWindow({
      width: 520,
      height: 420,
      minWidth: 380,
      minHeight: 280,
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
      ? 'http://localhost:5173/#/overlay'
      : `file://${path.join(__dirname, '../../dist/index.html')}#/overlay`;

    await this.window.loadURL(targetUrl);

    this.window.webContents.once('did-finish-load', () => {
      if (this.currentData) {
        this.window?.webContents.send(IPC_CHANNELS.EVENT_OVERLAY_DATA, this.currentData);
      }
      this.window?.show();
    });

    this.window.on('closed', () => {
      this.window = null;
    });
  }

  private positionWindow(coords: { x: number; y: number; width?: number; height?: number }): void {
    if (!this.window || this.window.isDestroyed()) return;
    const primaryDisplay = screen.getPrimaryDisplay();
    const bounds = primaryDisplay.workArea;

    let targetX = coords.x;
    let targetY = coords.y + (coords.height || 0) + 15;

    // Check bounds
    if (targetX + 520 > bounds.width) {
      targetX = bounds.width - 540;
    }
    if (targetY + 420 > bounds.height) {
      targetY = Math.max(20, coords.y - 440);
    }

    this.window.setPosition(Math.round(targetX), Math.round(targetY));
  }

  public setAlwaysOnTop(flag: boolean): void {
    this.window?.setAlwaysOnTop(flag, 'floating');
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
