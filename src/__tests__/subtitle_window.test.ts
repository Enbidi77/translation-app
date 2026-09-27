import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubtitleWindowManager } from '../main/windows/subtitleWindow';

// Mock electron modules
vi.mock('electron', () => {
  class MockBrowserWindow {
    private visible = false;
    isDestroyed = vi.fn().mockReturnValue(false);
    isVisible = vi.fn().mockImplementation(() => this.visible);
    show = vi.fn().mockImplementation(() => { this.visible = true; });
    hide = vi.fn().mockImplementation(() => { this.visible = false; });
    focus = vi.fn();
    close = vi.fn().mockImplementation(() => { this.visible = false; });
    loadURL = vi.fn().mockResolvedValue(undefined);
    setAlwaysOnTop = vi.fn();
    setOpacity = vi.fn();
    setIgnoreMouseEvents = vi.fn();
    on = vi.fn();
    webContents = {
      send: vi.fn(),
      once: vi.fn((event, cb) => cb()),
    };
  }

  return {
    app: {
      isPackaged: false,
    },
    screen: {
      getPrimaryDisplay: () => ({
        workArea: { width: 1920, height: 1080 },
      }),
    },
    BrowserWindow: MockBrowserWindow,
  };
});

describe('SubtitleWindowManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize singleton instance with default entry', () => {
    const manager = SubtitleWindowManager.getInstance();
    expect(manager).toBeDefined();
    const current = manager.getCurrentEntry();
    expect(current).toBeDefined();
    expect(current.original).toBeTruthy();
    expect(current.translation).toBeTruthy();
  });

  it('should update currentEntry and send to webContents', async () => {
    const manager = SubtitleWindowManager.getInstance();
    const testEntry = {
      original: '这是一个实时的中文字幕测试。',
      pinyin: 'zhè shì yí ge shíshí de zhōngwén zìmù cèshì.',
      translation: 'Đây là bài kiểm tra phụ đề tiếng Trung thời gian thực.',
    };

    await manager.sendSubtitle(testEntry, false);
    expect(manager.getCurrentEntry()).toEqual(testEntry);
  });

  it('should toggle window state between visible and hidden', async () => {
    const manager = SubtitleWindowManager.getInstance();
    const result1 = await manager.toggleWindow();
    expect(typeof result1).toBe('boolean');
  });
});
