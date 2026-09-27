import { DatabaseService } from '../index';
import { AppSettings } from '../../shared/types';
import { DEFAULT_SETTINGS } from '../../shared/constants/settings';

export class SettingsRepository {
  private get db() {
    return DatabaseService.getInstance();
  }

  public getSettings(): AppSettings {
    const rows = this.db.query<{ key: string; value: string }>('SELECT key, value FROM settings');
    if (!rows || rows.length === 0) {
      return DEFAULT_SETTINGS;
    }

    const loadedSettings: any = {};
    for (const row of rows) {
      try {
        loadedSettings[row.key] = JSON.parse(row.value);
      } catch {
        loadedSettings[row.key] = row.value;
      }
    }

    return {
      general: { ...DEFAULT_SETTINGS.general, ...(loadedSettings.general || {}) },
      pinyin: { ...DEFAULT_SETTINGS.pinyin, ...(loadedSettings.pinyin || {}) },
      hotkeys: { ...DEFAULT_SETTINGS.hotkeys, ...(loadedSettings.hotkeys || {}) },
      providers: { ...DEFAULT_SETTINGS.providers, ...(loadedSettings.providers || {}) },
      subtitles: { ...DEFAULT_SETTINGS.subtitles, ...(loadedSettings.subtitles || {}) },
      logging: { ...DEFAULT_SETTINGS.logging, ...(loadedSettings.logging || {}) },
    };
  }

  public saveSettings(settings: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated: AppSettings = {
      general: { ...current.general, ...(settings.general || {}) },
      pinyin: { ...current.pinyin, ...(settings.pinyin || {}) },
      hotkeys: { ...current.hotkeys, ...(settings.hotkeys || {}) },
      providers: { ...current.providers, ...(settings.providers || {}) },
      subtitles: { ...current.subtitles, ...(settings.subtitles || {}) },
      logging: { ...current.logging, ...(settings.logging || {}) },
    };

    const keys: (keyof AppSettings)[] = ['general', 'pinyin', 'hotkeys', 'providers', 'subtitles', 'logging'];
    for (const key of keys) {
      this.db.run(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
        [key, JSON.stringify(updated[key])]
      );
    }

    return updated;
  }
}
