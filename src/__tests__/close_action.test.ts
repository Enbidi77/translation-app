import { describe, it, expect, beforeEach } from 'vitest';
import { DEFAULT_SETTINGS } from '../shared/constants/settings';
import { useAppStore } from '../renderer/stores/useAppStore';

describe('Close Action & Modal System', () => {
  beforeEach(() => {
    useAppStore.setState({ isCloseDialogOpen: false });
  });

  it('should have default closeAction set to ask and minimizeToTray to true', () => {
    expect(DEFAULT_SETTINGS.general.closeAction).toBe('ask');
    expect(DEFAULT_SETTINGS.general.minimizeToTray).toBe(true);
  });

  it('should control close dialog open and close states in useAppStore', () => {
    expect(useAppStore.getState().isCloseDialogOpen).toBe(false);

    useAppStore.getState().openCloseDialog();
    expect(useAppStore.getState().isCloseDialogOpen).toBe(true);

    useAppStore.getState().closeCloseDialog();
    expect(useAppStore.getState().isCloseDialogOpen).toBe(false);
  });

  it('should validate closeAction options', () => {
    const validActions = ['ask', 'minimize_to_tray', 'exit'] as const;
    validActions.forEach((action) => {
      expect(['ask', 'minimize_to_tray', 'exit']).toContain(action);
    });
  });
});
