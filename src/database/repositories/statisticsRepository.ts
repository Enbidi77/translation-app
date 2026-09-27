import { DatabaseService } from '../index';
import { LearningStatistics } from '../../shared/types';

export class StatisticsRepository {
  private get db() {
    return DatabaseService.getInstance();
  }

  public getStats(days = 14): LearningStatistics[] {
    const sql = `
      SELECT * FROM learning_statistics
      ORDER BY date DESC
      LIMIT ?
    `;
    const rows = this.db.query<any>(sql, [days]);
    return rows.reverse().map((r) => ({
      id: r.id,
      date: r.date,
      wordsLearned: r.words_learned,
      wordsReviewed: r.words_reviewed,
      listeningMinutes: r.listening_minutes,
      speakingMinutes: r.speaking_minutes,
      studyMinutesChinese: r.study_minutes_chinese,
      studyMinutesEnglish: r.study_minutes_english,
      streakDays: r.streak_days,
    }));
  }

  public getSummary() {
    const today = new Date().toISOString().split('T')[0];
    const todayStats = this.db.query<any>('SELECT * FROM learning_statistics WHERE date = ?', [today])[0] || {
      words_learned: 0,
      words_reviewed: 0,
      listening_minutes: 0,
      speaking_minutes: 0,
      study_minutes_chinese: 0,
      study_minutes_english: 0,
      streak_days: 1,
    };

    const totalWords = this.db.query<{ count: number }>('SELECT COUNT(*) as count FROM vocabulary')[0]?.count || 0;
    const totalReviews = this.db.query<{ count: number }>('SELECT COUNT(*) as count FROM review_sessions')[0]?.count || 0;
    const totalTranslations = this.db.query<{ count: number }>('SELECT COUNT(*) as count FROM translation_history')[0]?.count || 0;

    return {
      today: {
        wordsLearned: todayStats.words_learned || 0,
        wordsReviewed: todayStats.words_reviewed || 0,
        listeningMinutes: todayStats.listening_minutes || 0,
        speakingMinutes: todayStats.speaking_minutes || 0,
        studyMinutesChinese: todayStats.study_minutes_chinese || 0,
        studyMinutesEnglish: todayStats.study_minutes_english || 0,
        streakDays: todayStats.streak_days || 1,
      },
      totals: {
        totalWords,
        totalReviews,
        totalTranslations,
      },
    };
  }

  public recordStudyTime(type: 'chinese' | 'english' | 'listening' | 'speaking', minutes: number): void {
    const today = new Date().toISOString().split('T')[0];
    let col = 'study_minutes_chinese';
    if (type === 'english') col = 'study_minutes_english';
    if (type === 'listening') col = 'listening_minutes';
    if (type === 'speaking') col = 'speaking_minutes';

    this.db.run(
      `INSERT INTO learning_statistics (date, ${col}) VALUES (?, ?)
       ON CONFLICT(date) DO UPDATE SET ${col} = ${col} + ?`,
      [today, minutes, minutes]
    );
  }
}
