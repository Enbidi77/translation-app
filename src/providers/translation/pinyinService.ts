import { pinyin } from 'pinyin-pro';
import { WordToken } from '../../shared/types';
import { SEED_VOCABULARY } from '../../database/seeds/defaultVocabulary';

export class PinyinService {
  public static getPinyin(text: string, options: { toneType?: 'symbol' | 'num' | 'none' } = {}): string {
    if (!text || !this.isChinese(text)) return '';
    try {
      return pinyin(text, {
        toneType: options.toneType || 'symbol',
        type: 'string',
      });
    } catch (e) {
      console.error('[PinyinService] Error generating pinyin:', e);
      return '';
    }
  }

  public static isChinese(text: string): boolean {
    return /[\u4e00-\u9fa5]/.test(text);
  }

  public static getToneNumber(charPinyin: string): number {
    if (/[āēīōūǖ]/.test(charPinyin)) return 1;
    if (/[áéíóúǘ]/.test(charPinyin)) return 2;
    if (/[ǎěǐǒǔǚ]/.test(charPinyin)) return 3;
    if (/[àèìòùǜ]/.test(charPinyin)) return 4;
    return 5; // neutral
  }

  /**
   * Segment Chinese text into meaningful word tokens with Pinyin and translations
   */
  public static segmentChineseWords(text: string): WordToken[] {
    const tokens: WordToken[] = [];
    if (!this.isChinese(text)) return tokens;

    // Build a quick lookup dictionary from seed vocabulary
    const dict = new Map<string, { translation: string; pinyin: string; pos?: string; hsk?: number }>();
    for (const v of SEED_VOCABULARY) {
      if (v.language === 'zh') {
        dict.set(v.word, {
          translation: v.translation,
          pinyin: v.pinyin || '',
          pos: v.part_of_speech,
          hsk: v.hsk_level,
        });
      }
    }

    // Add extra common functional words & particles
    const commonWords: Record<string, { translation: string; pos: string; hsk: number }> = {
      '这个': { translation: 'cái này, việc này', pos: 'Đại từ', hsk: 1 },
      '那个': { translation: 'cái kia', pos: 'Đại từ', hsk: 1 },
      '我们': { translation: 'chúng tôi, chúng ta', pos: 'Đại từ', hsk: 1 },
      '你们': { translation: 'các bạn', pos: 'Đại từ', hsk: 1 },
      '他们': { translation: 'họ, bọn họ', pos: 'Đại từ', hsk: 1 },
      '非常': { translation: 'rất, vô cùng', pos: 'Phó từ', hsk: 2 },
      '适合': { translation: 'phù hợp, thích hợp', pos: 'Động từ', hsk: 3 },
      '新手': { translation: 'người mới, lính mới', pos: 'Danh từ', hsk: 3 },
      '使用': { translation: 'sử dụng, dùng', pos: 'Động từ', hsk: 3 },
      '角色': { translation: 'nhân vật, vai trò', pos: 'Danh từ', hsk: 4 },
      '可以': { translation: 'có thể', pos: 'Trợ động từ', hsk: 1 },
      '操作': { translation: 'thao tác, điều khiển', pos: 'Động từ/Danh từ', hsk: 4 },
      '简单': { translation: 'đơn giản', pos: 'Tính từ', hsk: 3 },
      '游戏': { translation: 'trò chơi, game', pos: 'Danh từ', hsk: 2 },
      '系统': { translation: 'hệ thống', pos: 'Danh từ', hsk: 4 },
      '很': { translation: 'rất', pos: 'Phó từ', hsk: 1 },
      '好玩': { translation: 'vui, hay ho', pos: 'Tính từ', hsk: 2 },
      '的': { translation: 'của, trợ từ kết cấu', pos: 'Trợ từ', hsk: 1 },
      '了': { translation: 'rồi (trợ từ ngữ khí/thời thái)', pos: 'Trợ từ', hsk: 1 },
      '在': { translation: 'ở, đang', pos: 'Giới từ/Phó từ', hsk: 1 },
      '有': { translation: 'có', pos: 'Động từ', hsk: 1 },
      '喜欢': { translation: 'thích', pos: 'Động từ', hsk: 1 },
      '学习': { translation: 'học tập', pos: 'Động từ', hsk: 1 },
    };

    for (const [w, meta] of Object.entries(commonWords)) {
      if (!dict.has(w)) {
        dict.set(w, {
          translation: meta.translation,
          pinyin: pinyin(w, { toneType: 'symbol' }),
          pos: meta.pos,
          hsk: meta.hsk,
        });
      }
    }

    // Forward maximum matching tokenizer
    const cleanText = text.trim();
    let i = 0;
    const maxLen = 4;

    while (i < cleanText.length) {
      let matched = false;
      const curChar = cleanText[i];

      // Skip whitespace and punctuation
      if (/[\s，。！？、；：""''（）《》\.,!\?]/.test(curChar)) {
        i++;
        continue;
      }

      for (let len = Math.min(maxLen, cleanText.length - i); len >= 2; len--) {
        const sub = cleanText.substring(i, i + len);
        if (dict.has(sub)) {
          const item = dict.get(sub)!;
          tokens.push({
            word: sub,
            pinyin: item.pinyin || pinyin(sub, { toneType: 'symbol' }),
            translation: item.translation,
            partOfSpeech: item.pos,
            hskLevel: item.hsk,
          });
          i += len;
          matched = true;
          break;
        }
      }

      if (!matched) {
        // Single character token
        const charPinyin = pinyin(curChar, { toneType: 'symbol' });
        const item = dict.get(curChar);
        tokens.push({
          word: curChar,
          pinyin: charPinyin,
          translation: item ? item.translation : '',
          partOfSpeech: item ? item.pos : undefined,
          hskLevel: item ? item.hsk : undefined,
        });
        i++;
      }
    }

    return tokens;
  }
}
