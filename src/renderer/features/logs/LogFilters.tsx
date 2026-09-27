import React from 'react';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  Calendar, 
  Tag, 
  Layers, 
  Terminal,
  Hash
} from 'lucide-react';
import { LogLevel, LogQueryFilter, LogSource } from '../../../shared/types/logging';

interface Props {
  filter: LogQueryFilter;
  onChange: (filter: LogQueryFilter) => void;
  onReset: () => void;
}

const CATEGORIES = [
  'all',
  'application',
  'database',
  'ipc',
  'ui',
  'ocr',
  'translation',
  'speech',
  'tts',
  'subtitle',
  'ai',
  'network',
  'settings',
  'performance',
  'security',
  'startup',
  'shutdown',
  'vocabulary',
  'flashcard',
];

const SOURCES: Array<'all' | LogSource> = ['all', 'main', 'renderer', 'preload', 'ipc', 'worker'];

export const LogFilters: React.FC<Props> = ({ filter, onChange, onReset }) => {
  const handleLevelChange = (level: string) => {
    onChange({
      ...filter,
      level: level === 'all' ? undefined : (level as LogLevel),
      page: 1,
    });
  };

  const handleCategoryChange = (category: string) => {
    onChange({
      ...filter,
      category: category === 'all' ? undefined : category,
      page: 1,
    });
  };

  const handleSourceChange = (source: string) => {
    onChange({
      ...filter,
      source: source === 'all' ? undefined : (source as LogSource),
      page: 1,
    });
  };

  const handleDatePreset = (preset: 'all' | 'today' | 'yesterday' | '24h' | '7d' | '30d') => {
    const now = Date.now();
    const startOfToday = new Date().setHours(0, 0, 0, 0);

    let startTime: number | undefined = undefined;
    let endTime: number | undefined = undefined;

    switch (preset) {
      case 'today':
        startTime = startOfToday;
        break;
      case 'yesterday':
        startTime = startOfToday - 24 * 60 * 60 * 1000;
        endTime = startOfToday;
        break;
      case '24h':
        startTime = now - 24 * 60 * 60 * 1000;
        break;
      case '7d':
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        startTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        startTime = undefined;
        endTime = undefined;
        break;
    }

    onChange({
      ...filter,
      startTime,
      endTime,
      page: 1,
    });
  };

  return (
    <div className="p-4 bg-surface border border-border rounded-2xl space-y-3.5 text-xs select-none">
      {/* Search and Quick Level Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-secondary" />
          <input
            type="text"
            value={filter.search || ''}
            onChange={(e) => onChange({ ...filter, search: e.target.value || undefined, page: 1 })}
            placeholder="Tìm kiếm thông điệp, mô-đun, sự kiện, lỗi, request ID..."
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-foreground-secondary/70 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {filter.search && (
            <button
              onClick={() => onChange({ ...filter, search: undefined, page: 1 })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-secondary hover:text-foreground text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Level Badges */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 shrink-0">
          <button
            onClick={() => handleLevelChange('all')}
            className={`px-2.5 py-1.5 rounded-xl font-medium transition-all ${
              !filter.level
                ? 'bg-primary text-primary-foreground shadow-google-sm font-semibold'
                : 'bg-background border border-border text-foreground-secondary hover:text-foreground hover:bg-surface-hover'
            }`}
          >
            Tất cả mức
          </button>
          {[
            { level: LogLevel.FATAL, label: 'FATAL', color: 'bg-red-500/20 text-red-500 border-red-500/30' },
            { level: LogLevel.ERROR, label: 'ERROR', color: 'bg-destructive-muted text-destructive border-destructive/30' },
            { level: LogLevel.WARN, label: 'WARN', color: 'bg-warning-muted text-warning border-warning/30' },
            { level: LogLevel.INFO, label: 'INFO', color: 'bg-primary-muted text-primary border-primary/30' },
            { level: LogLevel.DEBUG, label: 'DEBUG', color: 'bg-surface-hover text-foreground-secondary border-border' },
            { level: LogLevel.TRACE, label: 'TRACE', color: 'bg-surface-hover text-foreground-secondary border-border' },
          ].map(({ level, label, color }) => (
            <button
              key={level}
              onClick={() => handleLevelChange(level)}
              className={`px-2 py-1.5 rounded-xl font-bold text-[11px] transition-all border ${
                filter.level === level
                  ? `${color} ring-1 ring-primary shadow-google-sm`
                  : 'bg-background border-border text-foreground-secondary hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Dropdown Filters Row */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
        {/* Category Dropdown */}
        <div className="flex items-center gap-1.5 bg-background border border-border px-2 py-1 rounded-xl">
          <Tag className="w-3.5 h-3.5 text-foreground-secondary shrink-0" />
          <select
            value={typeof filter.category === 'string' ? filter.category : 'all'}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">Mọi danh mục</option>
            {CATEGORIES.filter((c) => c !== 'all').map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Source Dropdown */}
        <div className="flex items-center gap-1.5 bg-background border border-border px-2 py-1 rounded-xl">
          <Terminal className="w-3.5 h-3.5 text-foreground-secondary shrink-0" />
          <select
            value={typeof filter.source === 'string' ? filter.source : 'all'}
            onChange={(e) => handleSourceChange(e.target.value)}
            className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">Mọi nguồn (Source)</option>
            {SOURCES.filter((s) => s !== 'all').map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Date Presets */}
        <div className="flex items-center gap-1 bg-background border border-border p-0.5 rounded-xl">
          <Calendar className="w-3.5 h-3.5 ml-1.5 text-foreground-secondary shrink-0" />
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'today', label: 'Hôm nay' },
            { id: 'yesterday', label: 'Hôm qua' },
            { id: '24h', label: '24 giờ' },
            { id: '7d', label: '7 ngày' },
            { id: '30d', label: '30 ngày' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleDatePreset(preset.id as any)}
              className="px-2 py-1 rounded-lg text-[11px] font-medium text-foreground-secondary hover:text-foreground hover:bg-surface transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Request ID Filter */}
        <div className="flex items-center gap-1 bg-background border border-border px-2 py-1 rounded-xl">
          <Hash className="w-3.5 h-3.5 text-foreground-secondary shrink-0" />
          <input
            type="text"
            value={filter.requestId || ''}
            onChange={(e) => onChange({ ...filter, requestId: e.target.value || undefined, page: 1 })}
            placeholder="Request ID..."
            className="bg-transparent text-xs text-foreground focus:outline-none w-24"
          />
        </div>

        {/* Reset Filter Button */}
        <button
          onClick={onReset}
          className="ml-auto flex items-center gap-1 px-3 py-1 rounded-xl bg-surface hover:bg-surface-hover border border-border text-foreground-secondary hover:text-foreground text-[11px] font-medium transition-colors"
          title="Đặt lại bộ lọc"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Đặt lại</span>
        </button>
      </div>
    </div>
  );
};
