import { app, BrowserWindow } from 'electron';
import path from 'path';
import { DatabaseService } from '../database';
import { setupIpcHandlers } from './ipc/handlers';
import { MainWindowManager } from './windows/mainWindow';
import { TrayService } from './services/trayService';
import { ShortcutService } from './services/shortcutService';
import { ClipboardService } from './services/clipboardService';
import { SettingsRepository } from '../database/repositories/settingsRepository';
import { logger } from './logging/logger';
import { LoggerService } from './logging/logger-service';
import dotenv from 'dotenv';

// Load .env if present
dotenv.config();

// Global unhandled error handlers for Electron Main Process
process.on('uncaughtException', (error) => {
  logger.fatal('Uncaught Exception in Main Process', {
    category: 'system',
    module: 'main',
    event: 'uncaught_exception',
    error,
  });
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection in Main Process', {
    category: 'system',
    module: 'main',
    event: 'unhandled_rejection',
    error: reason,
  });
});

// Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  logger.warn('Second application instance prevented from launching', {
    category: 'system',
    event: 'second_instance_rejected',
  });
  app.quit();
} else {
  app.on('second-instance', () => {
    logger.info('Second instance detected, focusing existing window', {
      category: 'system',
      event: 'second_instance_focus',
    });
    const win = MainWindowManager.getInstance().getWindow();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  });
}

let shutdownReason = 'user_exit';

async function bootstrap() {
  console.log('[Main] Initializing PolyglotDesktop application...');

  // Initialize SQLite database
  const userDataDir = app.getPath('userData');
  await DatabaseService.getInstance().initialize(userDataDir);

  // Initialize Logger Service with saved settings
  const settingsRepo = new SettingsRepository();
  const settings = settingsRepo.getSettings();
  LoggerService.getInstance().init(settings.logging);

  // Record application startup log
  logger.info('Application started', {
    category: 'startup',
    module: 'main',
    event: 'application_started',
    metadata: {
      appVersion: app.getVersion(),
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      nodeVersion: process.versions.node,
      platform: process.platform,
      architecture: process.arch,
      environment: process.env.NODE_ENV || 'production',
    },
  });

  // Setup IPC Handlers
  setupIpcHandlers();

  // Create Main Window
  const mainWindow = MainWindowManager.getInstance().createWindow();
  logger.info('Main window initialized', {
    category: 'ui',
    module: 'window-manager',
    event: 'window_created',
  });

  // Initialize System Tray
  TrayService.getInstance().createTray();

  // Register Global Shortcuts
  ShortcutService.getInstance().registerShortcuts(settings.hotkeys);

  // Start Clipboard Watcher
  if (settings.general.enableClipboardWatcher) {
    ClipboardService.getInstance().startWatching(() => MainWindowManager.getInstance().getWindow());
  }

  console.log('[Main] Application started successfully.');
}

app.whenReady().then(bootstrap);

app.on('window-all-closed', () => {
  const settings = new SettingsRepository().getSettings();
  const closeAction = settings.general?.closeAction || (settings.general?.minimizeToTray ? 'minimize_to_tray' : 'exit');
  if (closeAction === 'exit' || !settings.general?.minimizeToTray) {
    shutdownReason = 'window_closed';
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    MainWindowManager.getInstance().createWindow();
  }
});

app.on('before-quit', () => {
  MainWindowManager.getInstance().setForceQuitting(true);
  logger.info('Application shutdown', {
    category: 'shutdown',
    module: 'main',
    event: 'application_shutdown',
    metadata: {
      reason: shutdownReason,
      uptimeSeconds: Math.round(process.uptime()),
    },
  });
});

app.on('will-quit', async (event) => {
  ShortcutService.getInstance().unregisterAll();
  ClipboardService.getInstance().stopWatching();
  TrayService.getInstance().destroy();

  // Flush remaining logs before database close
  try {
    await LoggerService.getInstance().shutdown();
  } catch (err) {
    console.error('[Main] Failed to cleanly shutdown logger:', err);
  }

  DatabaseService.getInstance().close();
});
