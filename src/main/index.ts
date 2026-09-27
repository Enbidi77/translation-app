import { app, BrowserWindow } from 'electron';
import path from 'path';
import { DatabaseService } from '../database';
import { setupIpcHandlers } from './ipc/handlers';
import { MainWindowManager } from './windows/mainWindow';
import { TrayService } from './services/trayService';
import { ShortcutService } from './services/shortcutService';
import { ClipboardService } from './services/clipboardService';
import { SettingsRepository } from '../database/repositories/settingsRepository';
import dotenv from 'dotenv';

// Load .env if present
dotenv.config();

// Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = MainWindowManager.getInstance().getWindow();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  });
}

async function bootstrap() {
  console.log('[Main] Initializing PolyglotDesktop application...');

  // Initialize SQLite database
  const userDataDir = app.getPath('userData');
  await DatabaseService.getInstance().initialize(userDataDir);

  // Setup IPC Handlers
  setupIpcHandlers();

  // Create Main Window
  const mainWindow = MainWindowManager.getInstance().createWindow();

  // Initialize System Tray
  TrayService.getInstance().createTray();

  // Register Global Shortcuts
  const settings = new SettingsRepository().getSettings();
  ShortcutService.getInstance().registerShortcuts(settings.hotkeys);

  // Start Clipboard Watcher
  if (settings.general.enableClipboardWatcher) {
    ClipboardService.getInstance().startWatching(() => MainWindowManager.getInstance().getWindow());
  }

  console.log('[Main] Application started successfully.');
}

app.whenReady().then(bootstrap);

app.on('window-all-closed', () => {
  // On Windows, keep running in tray if minimizeToTray is enabled, or exit
  const settings = new SettingsRepository().getSettings();
  if (!settings.general.minimizeToTray) {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    MainWindowManager.getInstance().createWindow();
  }
});

app.on('will-quit', () => {
  ShortcutService.getInstance().unregisterAll();
  ClipboardService.getInstance().stopWatching();
  TrayService.getInstance().destroy();
  DatabaseService.getInstance().close();
});
