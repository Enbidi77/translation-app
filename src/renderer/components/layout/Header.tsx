import React from 'react';
import { Minus, Square, X, Crop, Globe, Sun, Moon, Monitor } from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useAppStore } from '../../stores/useAppStore';
import { I18nLocale } from '../../i18n';
import { ThemeMode } from '../../../shared/design/theme';
import appLogo from '../../../../assets/icon.png';

export const Header: React.FC = () => {
  const { locale, setLocale, themeMode, setThemeMode, dict, settings } = useSettingsStore();
  const { openCloseDialog } = useAppStore();

  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = () => window.electronAPI?.maximize();
  const handleClose = () => {
    const action = settings?.general?.closeAction || 'ask';
    if (action === 'exit') {
      window.electronAPI?.quitApp();
    } else if (action === 'minimize_to_tray') {
      window.electronAPI?.minimizeToTray();
    } else {
      openCloseDialog();
    }
  };
  const handleTriggerSnip = () => window.electronAPI?.triggerSnip();

  return (
    <header className="h-11 bg-surface border-b border-border flex items-center justify-between px-3 select-none titlebar-drag z-40 transition-colors">
      {/* Left: App Brand & Quick Action */}
      <div className="flex items-center gap-3 titlebar-no-drag">
        <div className="flex items-center gap-2">
          <img
            src={appLogo}
            alt="Polyglot Desktop Logo"
            className="w-6 h-6 rounded-md object-contain shadow-sm"
          />
          <span className="font-semibold text-xs text-foreground tracking-wide">
            Polyglot<span className="text-primary font-normal">Desktop</span>
          </span>
        </div>

        <button
          onClick={handleTriggerSnip}
          className="ml-2 px-2.5 py-1 rounded-md bg-primary-muted hover:bg-primary-hover/20 text-primary border border-primary/30 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-google-sm"
          title="Chụp & dịch bất kỳ vùng nào trên màn hình (Ctrl+Shift+T)"
        >
          <Crop className="w-3.5 h-3.5" />
          <span>Dịch màn hình</span>
          <kbd className="px-1 py-0.2 text-[10px] bg-primary-muted rounded border border-primary/40 font-mono">
            Ctrl+Shift+T
          </kbd>
        </button>
      </div>

      {/* Right: Theme Switcher, Language Switch & Window Controls */}
      <div className="flex items-center gap-2 titlebar-no-drag">
        {/* Quick Theme Switcher */}
        <div className="flex items-center bg-surface-hover border border-border rounded-lg p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setThemeMode('light')}
            className={`p-1 rounded-md transition-all ${
              themeMode === 'light'
                ? 'bg-surface text-primary shadow-google-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Giao diện sáng (Light Theme)"
            aria-label="Light theme"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setThemeMode('dark')}
            className={`p-1 rounded-md transition-all ${
              themeMode === 'dark'
                ? 'bg-surface text-primary shadow-google-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Giao diện tối (Dark Theme)"
            aria-label="Dark theme"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setThemeMode('system')}
            className={`p-1 rounded-md transition-all ${
              themeMode === 'system'
                ? 'bg-surface text-primary shadow-google-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Theo hệ điều hành (System Theme)"
            aria-label="System theme"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-1 bg-surface border border-border rounded-md px-1.5 py-0.5 text-xs">
          <Globe className="w-3 h-3 text-muted-foreground" />
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as I18nLocale)}
            className="bg-transparent text-foreground text-xs focus:outline-none cursor-pointer pr-1"
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
            <option value="zh">简体中文</option>
          </select>
        </div>

        {/* Window controls */}
        <div className="flex items-center ml-1">
          <button
            onClick={handleMinimize}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-hover rounded transition-colors"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-hover rounded transition-colors"
            title="Maximize"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-destructive rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
