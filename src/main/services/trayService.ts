import { Tray, Menu, nativeImage, app } from 'electron';
import path from 'path';
import { MainWindowManager } from '../windows/mainWindow';
import { SnipWindowManager } from '../windows/snipWindow';
import { SubtitleWindowManager } from '../windows/subtitleWindow';

export class TrayService {
  private static instance: TrayService | null = null;
  private tray: Tray | null = null;

  public static getInstance(): TrayService {
    if (!TrayService.instance) {
      TrayService.instance = new TrayService();
    }
    return TrayService.instance;
  }

  public createTray(): void {
    if (this.tray) return;

    // Create a 16x16 icon programmatically if file doesn't exist
    const icon = nativeImage.createFromBuffer(
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAZElEQVQ4T2NkoBAwUqifgWoG/P//n5GBgYGBhYWFgZGRkYEvXbrEwMDAwMDKysrAwMDAwMLCwsDGxgaxA6mGEQsGagBIM4ymBng0DBhGA9A0gA0m+sGAgQEIjUZHR8MoH2QEAO/pD5f5JvTTAAAAAElFTkSuQmCC',
        'base64'
      )
    );

    this.tray = new Tray(icon);
    this.tray.setToolTip('PolyglotDesktop - Trợ Lý Học Ngoại Ngữ');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Mở ứng dụng chính',
        click: () => {
          const win = MainWindowManager.getInstance().getWindow();
          if (win) {
            win.show();
            win.focus();
          } else {
            MainWindowManager.getInstance().createWindow();
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Dịch màn hình (Ctrl+Shift+T)',
        click: () => {
          SnipWindowManager.getInstance().startSnip();
        },
      },
      {
        label: 'Quét chữ OCR (Ctrl+Shift+O)',
        click: () => {
          SnipWindowManager.getInstance().startSnip();
        },
      },
      {
        label: 'Bật / Tắt Phụ đề nổi (Ctrl+Shift+S)',
        click: () => {
          SubtitleWindowManager.getInstance().toggleWindow();
        },
      },
      {
        label: 'Dịch giọng nói (Ctrl+Shift+L)',
        click: () => {
          const win = MainWindowManager.getInstance().getWindow();
          if (win) {
            win.show();
            win.focus();
            win.webContents.send('route:navigate', '/voice');
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Thoát hoàn toàn',
        click: () => {
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.on('double-click', () => {
      const win = MainWindowManager.getInstance().getWindow();
      if (win) {
        win.show();
        win.focus();
      }
    });
  }

  public destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
