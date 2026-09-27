import React, { useState } from 'react';
import { 
  Palette, 
  Check, 
  Sparkles, 
  Layers, 
  Search, 
  Sliders, 
  Volume2, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Monitor 
} from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { TonePinyin } from './TonePinyin';

export const ThemePreviewCard: React.FC = () => {
  const { themeMode, effectiveTheme } = useSettingsStore();
  const [sampleInput, setSampleInput] = useState('你好世界 (Hello World)');
  const [toggleState, setToggleState] = useState(true);

  return (
    <div className="bg-card border border-border rounded-3xl p-6 space-y-6 shadow-google-md transition-all">
      {/* Header of Preview Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-primary-muted border border-primary/30 flex items-center justify-center text-primary shadow-google-sm">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>Xem trước giao diện thời gian thực</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-muted text-primary border border-primary/30">
                Live Preview
              </span>
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Mô phỏng màu sắc, thẻ, nút bấm, kiểu chữ Hán và Pinyin theo theme hiện tại.
            </p>
          </div>
        </div>

        {/* Current Theme Indicator Badge */}
        <div className="flex items-center gap-2 self-start sm:self-center px-3 py-1.5 rounded-2xl bg-surface border border-border text-xs shadow-google-sm">
          {effectiveTheme === 'dark' ? (
            <Moon className="w-3.5 h-3.5 text-primary" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-warning" />
          )}
          <span className="font-semibold text-foreground">
            {effectiveTheme === 'dark' ? 'Google Charcoal Dark' : 'Google Neutral Light'}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            ({themeMode === 'system' ? 'Theo OS' : themeMode})
          </span>
        </div>
      </div>

      {/* Grid of Design Tokens */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Bảng màu thiết kế (Design Tokens & Color Swatches):
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {/* Background */}
          <div className="p-2.5 rounded-2xl border border-border bg-background space-y-1 shadow-google-sm">
            <div className="text-[10px] font-medium text-muted-foreground">Background</div>
            <div className="text-xs font-bold text-foreground font-mono">
              {effectiveTheme === 'dark' ? '#202124' : '#F8F9FA'}
            </div>
          </div>
          {/* Surface */}
          <div className="p-2.5 rounded-2xl border border-border bg-surface space-y-1 shadow-google-sm">
            <div className="text-[10px] font-medium text-muted-foreground">Surface</div>
            <div className="text-xs font-bold text-foreground font-mono">
              {effectiveTheme === 'dark' ? '#292A2D' : '#FFFFFF'}
            </div>
          </div>
          {/* Primary Blue */}
          <div className="p-2.5 rounded-2xl border border-primary/30 bg-primary-muted space-y-1 shadow-google-sm">
            <div className="text-[10px] font-medium text-primary">Primary</div>
            <div className="text-xs font-bold text-primary font-mono">
              {effectiveTheme === 'dark' ? '#8AB4F8' : '#1A73E8'}
            </div>
          </div>
          {/* Success Green */}
          <div className="p-2.5 rounded-2xl border border-success/30 bg-success-muted space-y-1 shadow-google-sm">
            <div className="text-[10px] font-medium text-success">Success</div>
            <div className="text-xs font-bold text-success font-mono">
              {effectiveTheme === 'dark' ? '#81C995' : '#1E8E3E'}
            </div>
          </div>
          {/* Warning Amber */}
          <div className="p-2.5 rounded-2xl border border-warning/30 bg-warning-muted space-y-1 shadow-google-sm">
            <div className="text-[10px] font-medium text-warning">Warning</div>
            <div className="text-xs font-bold text-warning font-mono">
              {effectiveTheme === 'dark' ? '#FDD663' : '#F9AB00'}
            </div>
          </div>
          {/* Destructive Red */}
          <div className="p-2.5 rounded-2xl border border-destructive/30 bg-destructive-muted space-y-1 shadow-google-sm">
            <div className="text-[10px] font-medium text-destructive">Danger</div>
            <div className="text-xs font-bold text-destructive font-mono">
              {effectiveTheme === 'dark' ? '#F28B82' : '#D93025'}
            </div>
          </div>
          {/* Subtle Border */}
          <div className="p-2.5 rounded-2xl border border-border bg-surface-hover space-y-1 shadow-google-sm">
            <div className="text-[10px] font-medium text-muted-foreground">Border</div>
            <div className="text-xs font-bold text-foreground font-mono">
              {effectiveTheme === 'dark' ? '#3C4043' : '#DADCE0'}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive UI Specimens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Left specimen: Typography & Pinyin Tones */}
        <div className="p-4 rounded-2xl bg-surface border border-border space-y-3 shadow-google-sm">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Kiểu chữ & Thanh điệu tiếng Trung:
          </span>

          <div className="space-y-1.5">
            <div className="text-xl font-bold text-foreground tracking-wide font-sans">
              学而时习之，不亦说乎
            </div>
            <div className="text-xs font-medium text-muted-foreground">
              Học nhi thời tập chi, bất diệc duyệt hồ (Khổng Tử)
            </div>
            <div className="pt-1 border-t border-border">
              <TonePinyin pinyin="Xué ér shí xí zhī, bù yì yuè hū?" className="text-xs font-medium" />
            </div>
          </div>

          <div className="pt-2 border-t border-border space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
              4 Thanh điệu chuẩn (Tone Colors):
            </span>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="tone-1 px-2 py-0.5 rounded-md bg-surface-hover border border-border">Thanh 1: mā</span>
              <span className="tone-2 px-2 py-0.5 rounded-md bg-surface-hover border border-border">Thanh 2: má</span>
              <span className="tone-3 px-2 py-0.5 rounded-md bg-surface-hover border border-border">Thanh 3: mǎ</span>
              <span className="tone-4 px-2 py-0.5 rounded-md bg-surface-hover border border-border">Thanh 4: mà</span>
            </div>
          </div>
        </div>

        {/* Right specimen: Buttons, Inputs & Elevation */}
        <div className="p-4 rounded-2xl bg-surface border border-border space-y-3 shadow-google-sm">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Nút bấm & Thành phần tương tác:
          </span>

          {/* Interactive sample input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              value={sampleInput}
              onChange={(e) => setSampleInput(e.target.value)}
              className="w-full bg-surface-hover border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-google-sm"
              placeholder="Nhập thử văn bản..."
            />
          </div>

          {/* Buttons row */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs shadow-google-sm flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Primary Button</span>
            </button>

            <button
              type="button"
              className="px-3.5 py-1.5 rounded-xl bg-surface-hover hover:bg-surface-active text-foreground font-medium text-xs border border-border transition-colors shadow-google-sm"
            >
              Secondary Outline
            </button>

            <button
              type="button"
              className="px-3 py-1.5 rounded-xl bg-destructive-muted text-destructive hover:bg-destructive/20 font-medium text-xs border border-destructive/30 transition-colors"
            >
              Destructive
            </button>
          </div>

          {/* Badges & Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
            <span className="px-2 py-0.5 rounded-lg bg-primary-muted text-primary text-[10px] font-bold border border-primary/30">
              HSK 4
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-success-muted text-success text-[10px] font-bold border border-success/30">
              CEFR B2
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-warning-muted text-warning text-[10px] font-bold border border-warning/30">
              SRS Due
            </span>
            <label className="ml-auto flex items-center gap-2 cursor-pointer text-xs text-foreground select-none">
              <input
                type="checkbox"
                checked={toggleState}
                onChange={(e) => setToggleState(e.target.checked)}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
              <span className="text-[11px] font-medium text-muted-foreground">Toggle Switch</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
