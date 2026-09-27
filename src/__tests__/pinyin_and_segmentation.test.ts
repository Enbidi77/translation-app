import { describe, it, expect } from 'vitest';
import { PinyinService } from '../providers/translation/pinyinService';

describe('PinyinService', () => {
  it('should generate pinyin with tone marks for Chinese text', () => {
    const text = '这个角色非常适合新手使用。';
    const py = PinyinService.getPinyin(text);
    expect(py).toBeTruthy();
    expect(py).toContain('zhè');
    expect(py).toContain('shì');
    expect(py).toContain('hé');
  });

  it('should detect Chinese characters correctly', () => {
    expect(PinyinService.isChinese('你好')).toBe(true);
    expect(PinyinService.isChinese('Hello World')).toBe(false);
    expect(PinyinService.isChinese('Xin chào')).toBe(false);
    expect(PinyinService.isChinese('角色 character')).toBe(true);
  });

  it('should classify tones 1 through 5 properly', () => {
    expect(PinyinService.getToneNumber('mā')).toBe(1);
    expect(PinyinService.getToneNumber('má')).toBe(2);
    expect(PinyinService.getToneNumber('mǎ')).toBe(3);
    expect(PinyinService.getToneNumber('mà')).toBe(4);
    expect(PinyinService.getToneNumber('ma')).toBe(5);
  });

  it('should segment sentence into tokens with meanings and pinyin', () => {
    const sentence = '这个角色非常适合新手使用。';
    const tokens = PinyinService.segmentChineseWords(sentence);
    expect(tokens.length).toBeGreaterThan(0);

    const words = tokens.map((t) => t.word);
    expect(words).toContain('角色');
    expect(words).toContain('适合');
    expect(words).toContain('新手');

    const shiheToken = tokens.find((t) => t.word === '适合');
    expect(shiheToken).toBeDefined();
    expect(shiheToken?.translation).toContain('phù hợp');
    expect(shiheToken?.hskLevel).toBe(3);
  });
});
