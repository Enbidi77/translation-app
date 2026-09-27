import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { THEME_PALETTES, THEME_STORAGE_KEY, ThemeMode, SubtitleThemeMode } from '../shared/design/theme';
import { SettingsRepository } from '../database/repositories/settingsRepository';
import { DatabaseService } from '../database';
import fs from 'fs';
import path from 'path';

describe('Professional Theme System', () => {
  const testDbDir = path.join(process.cwd(), 'tmp_test_theme_db');

  beforeAll(async () => {
    if (!fs.existsSync(testDbDir)) {
      fs.mkdirSync(testDbDir, { recursive: true });
    }
    await DatabaseService.getInstance().initialize(testDbDir);
  });

  afterAll(() => {
    DatabaseService.getInstance().close();
    try {
      fs.rmSync(testDbDir, { recursive: true, force: true });
    } catch {}
  });

  it('should define accurate Google-inspired dark palette tokens', () => {
    const dark = THEME_PALETTES.dark;
    expect(dark.background).toBe('#202124'); // Charcoal, not harsh #000000
    expect(dark.surface).toBe('#292a2d');
    expect(dark.surfaceHover).toBe('#303134');
    expect(dark.elevated).toBe('#35363a');
    expect(dark.border).toBe('#3c4043');
    expect(dark.textPrimary).toBe('#e8eaed');
    expect(dark.textSecondary).toBe('#bdc1c6');
    expect(dark.textMuted).toBe('#9aa0a6');
    expect(dark.primary).toBe('#8ab4f8'); // Google Dark blue
    expect(dark.success).toBe('#81c995'); // Google Dark green
    expect(dark.warning).toBe('#fdd663'); // Google Dark amber
    expect(dark.destructive).toBe('#f28b82'); // Google Dark red
  });

  it('should define accurate Google-inspired light palette tokens', () => {
    const light = THEME_PALETTES.light;
    expect(light.background).toBe('#f8f9fa'); // Soft warm neutral, low eye strain
    expect(light.surface).toBe('#ffffff');
    expect(light.surfaceHover).toBe('#f1f3f4');
    expect(light.border).toBe('#dadce0');
    expect(light.textPrimary).toBe('#202124');
    expect(light.textSecondary).toBe('#5f6368');
    expect(light.textMuted).toBe('#80868b');
    expect(light.primary).toBe('#1a73e8'); // Google Blue
    expect(light.success).toBe('#1e8e3e'); // Google Green
    expect(light.warning).toBe('#f9ab00'); // Google Amber
    expect(light.destructive).toBe('#d93025'); // Google Red
  });

  it('should persist theme mode and subtitle theme in settings repository', () => {
    const settingsRepo = new SettingsRepository();
    const initial = settingsRepo.getSettings();
    expect(initial.general.theme).toBeDefined();

    // Change to light theme
    const updatedLight = settingsRepo.saveSettings({
      general: {
        ...initial.general,
        theme: 'light',
      },
      subtitles: {
        ...initial.subtitles,
        subtitleTheme: 'transparent',
      },
    });

    expect(updatedLight.general.theme).toBe('light');
    expect(updatedLight.subtitles.subtitleTheme).toBe('transparent');

    // Reload from fresh repo instance to ensure persistence in SQLite
    const reloadedSettings = new SettingsRepository().getSettings();
    expect(reloadedSettings.general.theme).toBe('light');
    expect(reloadedSettings.subtitles.subtitleTheme).toBe('transparent');

    // Change to system theme
    const updatedSystem = settingsRepo.saveSettings({
      general: {
        ...reloadedSettings.general,
        theme: 'system',
      },
    });
    expect(updatedSystem.general.theme).toBe('system');
  });

  it('should support all 4 subtitle theme modes', () => {
    const subtitleModes: SubtitleThemeMode[] = ['follow_app', 'dark', 'light', 'transparent'];
    const settingsRepo = new SettingsRepository();

    subtitleModes.forEach((mode) => {
      const saved = settingsRepo.saveSettings({
        subtitles: {
          ...settingsRepo.getSettings().subtitles,
          subtitleTheme: mode,
        },
      });
      expect(saved.subtitles.subtitleTheme).toBe(mode);
    });
  });
});
