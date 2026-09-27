import React, { useState, useEffect } from 'react';
import { Crop, Loader2 } from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';

export const SnipOverlay: React.FC = () => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { initTheme } = useSettingsStore();

  useEffect(() => {
    const unsubTheme = initTheme();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.electronAPI?.cancelSnip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unsubTheme?.();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isProcessing) return;
    setIsSelecting(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setCurrentPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || isProcessing) return;
    setCurrentPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = async () => {
    if (!isSelecting || !startPos || !currentPos || isProcessing) return;
    setIsSelecting(false);

    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);

    if (width > 20 && height > 20) {
      setIsProcessing(true);
      try {
        await window.electronAPI?.completeSnip({ x, y, width, height });
      } catch (err) {
        console.error('Snip failed:', err);
        setIsProcessing(false);
      }
    } else {
      // Reset if user just clicked without dragging
      setStartPos(null);
      setCurrentPos(null);
    }
  };

  const rect = startPos && currentPos ? {
    x: Math.min(startPos.x, currentPos.x),
    y: Math.min(startPos.y, currentPos.y),
    width: Math.abs(currentPos.x - startPos.x),
    height: Math.abs(currentPos.y - startPos.y),
  } : null;

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="fixed inset-0 select-none cursor-crosshair overflow-hidden bg-transparent"
    >
      {/* Semi-transparent tint across entire screen when no box is selected yet */}
      {!rect && (
        <div className="absolute inset-0 bg-black/25 pointer-events-none" />
      )}

      {/* Top Banner Guide */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-surface text-foreground rounded-full border border-border shadow-google-lg flex items-center gap-2 text-xs font-medium z-50 pointer-events-none">
        <Crop className="w-4 h-4 text-primary animate-pulse" />
        <span>
          Kéo chuột để chọn vùng chữ cần dịch • Nhấn{' '}
          <kbd className="px-1.5 py-0.5 bg-surface-hover rounded font-mono border border-border text-foreground">
            Esc
          </kbd>{' '}
          để hủy
        </span>
      </div>

      {/* Selected Box with Clear Transparent Hole & Darkened Outer Area */}
      {rect && (
        <div
          className="absolute border-2 border-primary pointer-events-none"
          style={{
            left: `${rect.x}px`,
            top: `${rect.y}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            backgroundColor: 'transparent',
            boxShadow: '0 0 0 99999px rgba(0, 0, 0, 0.45)',
          }}
        >
          {/* Corner Precision Markers */}
          <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-primary" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-primary" />
          <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-primary" />
          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-primary" />

          {/* Dimension Badge */}
          <div className="absolute -top-7 left-0 px-2 py-0.5 bg-primary text-primary-foreground text-[11px] font-mono rounded shadow-google-sm whitespace-nowrap">
            {rect.width} × {rect.height} px
          </div>
        </div>
      )}

      {/* Processing State Modal */}
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="px-5 py-3.5 bg-surface border border-border rounded-2xl text-foreground text-xs font-semibold shadow-google-lg flex items-center gap-3">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span>Đang nhận diện chữ và dịch...</span>
          </div>
        </div>
      )}
    </div>
  );
};
