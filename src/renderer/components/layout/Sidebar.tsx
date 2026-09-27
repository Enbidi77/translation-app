import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Languages,
  ScanText,
  Mic,
  Subtitles,
  BookA,
  BookOpen,
  Layers,
  Headphones,
  Bot,
  History,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useFlashcardStore } from '../../stores/useFlashcardStore';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { dict } = useSettingsStore();
  const { stats } = useFlashcardStore();

  const navItems = [
    { to: '/', label: dict.sidebar.dashboard, icon: LayoutDashboard },
    { to: '/translate', label: dict.sidebar.translate, icon: Languages },
    { to: '/ocr', label: dict.sidebar.ocr, icon: ScanText },
    { to: '/voice', label: dict.sidebar.voice, icon: Mic },
    { to: '/subtitles', label: dict.sidebar.subtitles, icon: Subtitles },
    { to: '/dictionary', label: dict.sidebar.dictionary, icon: BookA },
    { to: '/vocabulary', label: dict.sidebar.vocabulary, icon: BookOpen },
    { 
      to: '/flashcards', 
      label: dict.sidebar.flashcards, 
      icon: Layers,
      badge: stats.due > 0 ? stats.due : undefined,
    },
    { to: '/practice', label: dict.sidebar.practice, icon: Headphones },
    { to: '/ai-tutor', label: dict.sidebar.aiTutor, icon: Bot },
    { to: '/history', label: dict.sidebar.history, icon: History },
    { to: '/statistics', label: dict.sidebar.statistics, icon: BarChart3 },
    { to: '/settings', label: dict.sidebar.settings, icon: Settings },
  ];

  return (
    <aside
      className={`h-[calc(100vh-2.75rem)] bg-slate-950/70 border-r border-slate-800 flex flex-col justify-between transition-all duration-200 select-none ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="py-2.5 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-primary/15 text-primary border border-primary/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {!collapsed && item.badge !== undefined && (
              <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-slate-800/80">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors text-xs"
          title={dict.sidebar.collapse}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
