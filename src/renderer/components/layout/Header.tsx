import React from 'react';
import { Minus, Square, X, Crop, Globe, Sparkles } from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { I18nLocale } from '../../i18n';

export const Header: React.FC = () => {
  const { locale, setLocale, dict } = useSettingsStore();

  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = () => window.electronAPI?.maximize();
  const handleClose = () => window.electronAPI?.close();
  const handleTriggerSnip = () => window.electronAPI?.triggerSnip();

  return (
    <header className="h-11 bg-slate-950/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-3 select-none titlebar-drag z-40">
      {/* Left: App Brand & Quick Action */}
      <div className="flex items-center gap-3 titlebar-no-drag">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            P
          </div>
          <span className="font-semibold text-xs text-slate-200 tracking-wide">
            Polyglot<span className="text-primary font-normal">Desktop</span>
          </span>
        </div>

        <button
          onClick={handleTriggerSnip}
          className="ml-2 px-2.5 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          title="Chụp & dịch bất kỳ vùng nào trên màn hình (Ctrl+Shift+T)"
        >
          <Crop className="w-3.5 h-3.5" />
          <span>Dịch màn hình</span>
          <kbd className="px-1 py-0.5 text-[10px] bg-primary/20 rounded border border-primary/40 font-mono">
            Ctrl+Shift+T
          </kbd>
        </button>
      </div>

      {/* Right: Language switch & Window Controls */}
      <div className="flex items-center gap-2 titlebar-no-drag">
        {/* Language selector */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-md px-1.5 py-0.5 text-xs">
          <Globe className="w-3 h-3 text-slate-400" />
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as I18nLocale)}
            className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer pr-1"
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
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Maximize"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-600 rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
