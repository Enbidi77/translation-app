import React, { useState, useEffect } from 'react';
import { X, Minimize2, Power, Check, HelpCircle } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useSettingsStore } from '../../stores/useSettingsStore';

export const CloseAppModal: React.FC = () => {
  const { isCloseDialogOpen, closeCloseDialog, showToast } = useAppStore();
  const { dict, settings, updateSettings } = useSettingsStore();

  const [selectedAction, setSelectedAction] = useState<'minimize_to_tray' | 'exit'>('minimize_to_tray');
  const [rememberChoice, setRememberChoice] = useState(false);

  useEffect(() => {
    if (isCloseDialogOpen) {
      // Default to minimize_to_tray if not previously chosen
      const defaultAction = settings?.general?.closeAction === 'exit' ? 'exit' : 'minimize_to_tray';
      setSelectedAction(defaultAction);
      setRememberChoice(false);
    }
  }, [isCloseDialogOpen, settings]);

  useEffect(() => {
    if (!isCloseDialogOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCloseDialog();
      } else if (e.key === 'Enter') {
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCloseDialogOpen, selectedAction, rememberChoice, settings]);

  if (!isCloseDialogOpen) return null;

  const t = dict?.closeDialog || {
    title: 'Đóng ứng dụng',
    subtitle: 'Bạn muốn đóng ứng dụng PolyglotDesktop như thế nào?',
    minimizeTitle: 'Thu nhỏ xuống khay hệ thống',
    minimizeDesc: 'Ứng dụng tiếp tục chạy ngầm trong khay hệ thống (System Tray). Phím tắt toàn cục vẫn hoạt động để dịch nhanh mọi lúc.',
    minimizeRecommended: 'Khuyên dùng',
    exitTitle: 'Thoát hoàn toàn ứng dụng',
    exitDesc: 'Đóng toàn bộ ứng dụng và giải phóng bộ nhớ. Phím tắt sẽ tạm dừng cho đến khi mở lại.',
    rememberChoice: 'Ghi nhớ lựa chọn này (không hỏi lại lần sau)',
    rememberHint: 'Bạn có thể thay đổi lại lựa chọn này trong Cài đặt chung bất kỳ lúc nào.',
    cancel: 'Hủy bỏ',
    confirm: 'Xác nhận',
  };

  const handleConfirm = async () => {
    if (rememberChoice) {
      await updateSettings({
        general: {
          ...settings?.general,
          closeAction: selectedAction,
          minimizeToTray: selectedAction !== 'exit',
        } as any,
      });
    }

    closeCloseDialog();

    if (selectedAction === 'minimize_to_tray') {
      window.electronAPI?.minimizeToTray();
      showToast(t.minimizeTitle, 'info');
    } else {
      window.electronAPI?.quitApp();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-google-xl p-5 space-y-4 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="close-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 id="close-dialog-title" className="text-base font-bold text-foreground">
                {t.title}
              </h2>
              <p className="text-xs text-muted-foreground">{t.subtitle}</p>
            </div>
          </div>
          <button
            onClick={closeCloseDialog}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors"
            title={t.cancel}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {/* Option 1: Minimize to tray */}
          <div
            onClick={() => setSelectedAction('minimize_to_tray')}
            className={`cursor-pointer p-3.5 rounded-xl border transition-all flex items-start gap-3 select-none ${
              selectedAction === 'minimize_to_tray'
                ? 'bg-primary/5 border-primary shadow-sm'
                : 'bg-surface hover:bg-surface-hover border-border'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                selectedAction === 'minimize_to_tray'
                  ? 'bg-primary text-primary-foreground shadow-google-sm'
                  : 'bg-surface-hover text-muted-foreground'
              }`}
            >
              <Minimize2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{t.minimizeTitle}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-primary/15 text-primary">
                  {t.minimizeRecommended}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t.minimizeDesc}</p>
            </div>
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                selectedAction === 'minimize_to_tray'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground/40'
              }`}
            >
              {selectedAction === 'minimize_to_tray' && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </div>

          {/* Option 2: Exit completely */}
          <div
            onClick={() => setSelectedAction('exit')}
            className={`cursor-pointer p-3.5 rounded-xl border transition-all flex items-start gap-3 select-none ${
              selectedAction === 'exit'
                ? 'bg-destructive/5 border-destructive shadow-sm'
                : 'bg-surface hover:bg-surface-hover border-border'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                selectedAction === 'exit'
                  ? 'bg-destructive text-white shadow-google-sm'
                  : 'bg-surface-hover text-muted-foreground'
              }`}
            >
              <Power className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-foreground">{t.exitTitle}</span>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t.exitDesc}</p>
            </div>
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                selectedAction === 'exit'
                  ? 'border-destructive bg-destructive text-white'
                  : 'border-muted-foreground/40'
              }`}
            >
              {selectedAction === 'exit' && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </div>
        </div>

        {/* Remember choice checkbox */}
        <div className="pt-2 border-t border-border">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberChoice}
              onChange={(e) => setRememberChoice(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-primary rounded cursor-pointer"
            />
            <div className="text-xs">
              <span className="text-foreground font-medium">{t.rememberChoice}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t.rememberHint}</p>
            </div>
          </label>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={closeCloseDialog}
            className="px-4 py-2 text-xs font-medium text-foreground hover:bg-surface-hover border border-border rounded-xl transition-colors"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-5 py-2 text-xs font-semibold rounded-xl text-white shadow-google-sm transition-all ${
              selectedAction === 'exit'
                ? 'bg-destructive hover:bg-destructive-hover'
                : 'bg-primary hover:bg-primary-hover text-primary-foreground'
            }`}
          >
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};
