import { describe, it, expect } from 'vitest';
import { AiManager } from '../providers/ai';
import { TranslationManager } from '../providers/translation';

describe('AiManager & Linguistic Analysis', () => {
  const aiManager = new AiManager();
  const transManager = new TranslationManager(aiManager);

  it('should analyze sentence structure (Subject, Predicate, Object)', async () => {
    const sentence = '这个角色非常适合新手使用。';
    const analysis = await aiManager.analyzeSentence(sentence, 'zh', 'vi');

    expect(analysis).toBeDefined();
    expect(analysis.original).toBe(sentence);
    expect(analysis.structure).toBeDefined();
    expect(analysis.pinyin).toContain('zhè');
    expect(analysis.vocabulary.length).toBeGreaterThan(0);
  });

  it('should detect Vietnamese learner redundancy error (e.g. 已经 + 昨天)', async () => {
    const errorSentence = '我昨天已经去了商店。';
    const analysis = await aiManager.analyzeSentence(errorSentence, 'zh', 'vi');

    expect(analysis.vietnameseLearnerTips).toBeDefined();
    expect(analysis.vietnameseLearnerTips?.commonMistake).toContain('已经');
    expect(analysis.vietnameseLearnerTips?.naturalAlternative).toBeTruthy();
  });

  it('should provide grammar assistant explanations', async () => {
    const explanation = await aiManager.explainGrammar('把', 'Cấu trúc câu chữ 把');
    expect(explanation.explanation).toContain('把');
    expect(explanation.examples.length).toBeGreaterThan(0);
  });

  it('should translate and augment with pinyin and vocabulary tokens', async () => {
    const res = await transManager.translate({
      text: '这个角色非常适合新手使用。',
      targetLang: 'vi',
      mode: 'learning',
    });

    expect(res).toBeDefined();
    expect(res.sourceText).toBe('这个角色非常适合新手使用。');
    expect(res.pinyin).toBeTruthy();
    expect(res.words).toBeDefined();
    expect(res.words?.length).toBeGreaterThan(0);
  });
});
