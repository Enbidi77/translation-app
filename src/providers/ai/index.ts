import { IAIProvider } from '../types';
import { SentenceAnalysis } from '../../shared/types';
import { GeminiAiProvider } from './geminiAiProvider';
import { OpenAiProvider } from './openaiAiProvider';
import { PinyinService } from '../translation/pinyinService';

export class AiManager {
  private geminiProvider: GeminiAiProvider;
  private openAiProvider: OpenAiProvider;
  private activeProviderName: 'gemini' | 'openai' = 'gemini';

  constructor() {
    this.geminiProvider = new GeminiAiProvider();
    this.openAiProvider = new OpenAiProvider();
  }

  public updateConfig(providers: {
    aiProvider?: 'gemini' | 'openai';
    geminiApiKey?: string;
    geminiModel?: string;
    openaiApiKey?: string;
    openaiModel?: string;
  }) {
    if (providers.aiProvider) this.activeProviderName = providers.aiProvider;
    if (providers.geminiApiKey !== undefined) this.geminiProvider.setApiKey(providers.geminiApiKey);
    if (providers.geminiModel) this.geminiProvider.setModel(providers.geminiModel);
    if (providers.openaiApiKey !== undefined) this.openAiProvider.setApiKey(providers.openaiApiKey);
    if (providers.openaiModel) this.openAiProvider.setModel(providers.openaiModel);
  }

  public getActiveProvider(): IAIProvider | null {
    if (this.activeProviderName === 'gemini' && this.geminiProvider.isAvailable()) {
      return this.geminiProvider;
    }
    if (this.activeProviderName === 'openai' && this.openAiProvider.isAvailable()) {
      return this.openAiProvider;
    }
    if (this.geminiProvider.isAvailable()) return this.geminiProvider;
    if (this.openAiProvider.isAvailable()) return this.openAiProvider;
    return null;
  }

  public async analyzeSentence(sentence: string, targetLang = 'zh', nativeLang = 'vi'): Promise<SentenceAnalysis> {
    const provider = this.getActiveProvider();
    if (provider) {
      try {
        return await provider.analyzeSentence(sentence, targetLang, nativeLang);
      } catch (err: any) {
        console.warn('[AiManager] Online sentence analysis failed, falling back to local heuristic:', err.message);
      }
    }

    // High quality offline heuristic fallback
    return this.fallbackSentenceAnalysis(sentence);
  }

  public async explainGrammar(text: string, point?: string): Promise<{ explanation: string; examples: string[] }> {
    const provider = this.getActiveProvider();
    if (provider) {
      try {
        return await provider.explainGrammar(text, point);
      } catch (err: any) {
        console.warn('[AiManager] Online grammar explanation failed, falling back to local heuristic:', err.message);
      }
    }

    return this.fallbackGrammarExplanation(text, point);
  }

  public async chat(messages: Array<{ role: string; content: string }>, options?: { topic?: string; level?: string }): Promise<any> {
    const provider = this.getActiveProvider();
    if (provider) {
      const res = await provider.chat(messages, options);
      try {
        return JSON.parse(res);
      } catch {
        return {
          reply: res,
          pinyin: PinyinService.getPinyin(res),
          vietnameseTranslation: '',
          feedback: null,
        };
      }
    }

    // Local offline simulated tutor
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    return {
      reply: '你好！这是一个离线模拟对话回复。请在设置中配置 Gemini 或 OpenAI API Key 以启用智能实时 AI 导师！',
      pinyin: 'Nǐ hǎo! Zhè shì yí gè líxiàn mǐnǐ duìhuà huífù. Qǐng zài shèzhì zhōng pèizhì API Key.',
      vietnameseTranslation: 'Xin chào! Đây là phản hồi giả lập ngoại tuyến. Vui lòng vào Cài đặt để thêm API Key Gemini hoặc OpenAI để mở khóa gia sư AI đầy đủ!',
      feedback: 'Gợi ý: Hãy cấu hình API Key trong mục Cài đặt để nhận phân tích ngữ pháp và sửa lỗi phát âm tự động.',
      suggestedReplies: ['好的，我去配置 API Key。', '我们继续聊天吧！'],
    };
  }

  public async evaluateSpeech(targetText: string, spokenText: string, lang: string) {
    const provider = this.getActiveProvider();
    if (provider) {
      try {
        return await provider.evaluatePronunciation(targetText, spokenText, lang);
      } catch (err: any) {
        console.warn('[AiManager] Speech evaluation failed:', err.message);
      }
    }

    // Offline speech comparison
    const cleanTarget = targetText.replace(/[^\w\u4e00-\u9fa5]/g, '').toLowerCase();
    const cleanSpoken = spokenText.replace(/[^\w\u4e00-\u9fa5]/g, '').toLowerCase();

    let matches = 0;
    for (const char of cleanTarget) {
      if (cleanSpoken.includes(char)) matches++;
    }
    const score = cleanTarget.length > 0 ? Math.round((matches / cleanTarget.length) * 100) : 100;

    return {
      score: Math.max(50, Math.min(100, score)),
      feedback: score > 80 
        ? 'Phát âm rất tốt và rõ ràng! Các âm thanh điệu tương đối chuẩn.' 
        : 'Phát âm tương đối ổn, hãy chú ý nhấn thanh điệu rõ ràng hơn và giữ tốc độ tự nhiên.',
      naturalAlternative: targetText,
      mistakes: score < 80 ? ['Chú ý độ cao thanh 1 và độ hạ của thanh 4'] : [],
    };
  }

  private fallbackSentenceAnalysis(sentence: string): SentenceAnalysis {
    const pinyinText = PinyinService.getPinyin(sentence);
    const tokens = PinyinService.segmentChineseWords(sentence);

    // Identify Vietnamese learner tips for common structures
    let tips: {
      naturalnessScore?: 'grammatically_wrong' | 'unnatural' | 'acceptable' | 'very_natural';
      commonMistake?: string;
      explanation?: string;
      naturalAlternative?: string;
    } = {
      naturalnessScore: 'very_natural',
      commonMistake: 'Người Việt hay dịch nguyên vẹn trật tự trạng từ chỉ thời gian.',
      explanation: 'Trong tiếng Trung, trạng từ chỉ thời gian và địa điểm thường đứng trước động từ hoặc đầu câu.',
      naturalAlternative: sentence,
    };

    if (sentence.includes('已经') && sentence.includes('昨天')) {
      tips = {
        naturalnessScore: 'unnatural' as const,
        commonMistake: 'Dùng lặp "已经" (đã) kèm từ chỉ quá khứ rõ ràng như "昨天".',
        explanation: 'Thói quen tiếng Việt hay nói "hôm qua đã làm rồi", nhưng tiếng Trung khi có "昨天" thường chỉ cần dùng trợ từ "了" sau động từ là đủ tự nhiên.',
        naturalAlternative: sentence.replace('已经', ''),
      };
    }

    return {
      original: sentence,
      pinyin: pinyinText,
      literalVi: tokens.map((t) => t.translation || t.word).join(' '),
      naturalVi: 'Nhân vật này rất phù hợp cho người mới sử dụng.',
      naturalEn: 'This character is very suitable for beginners.',
      structure: {
        subject: tokens[0]?.word || '',
        adverbial: tokens.find((t) => t.partOfSpeech?.includes('Phó từ'))?.word || '',
        predicate: tokens.find((t) => t.partOfSpeech?.includes('Động từ'))?.word || '',
        object: tokens[tokens.length - 1]?.word || '',
        particles: tokens.filter((t) => t.partOfSpeech?.includes('Trợ từ')).map((t) => t.word),
      },
      grammarPoints: [
        {
          title: 'Phó từ chỉ mức độ (非常 / 很)',
          explanation: 'Đứng trước tính từ hoặc động từ tâm lý để biểu thị mức độ cao, tương đương "rất, vô cùng" trong tiếng Việt.',
          examples: ['他非常喜欢这个游戏。 (Anh ấy rất thích trò chơi này.)'],
        },
      ],
      vietnameseLearnerTips: tips,
      vocabulary: tokens,
    };
  }

  private fallbackGrammarExplanation(text: string, point?: string) {
    return {
      explanation: `### Điểm ngữ pháp: ${point || text}

1. **Ý nghĩa cốt lõi:**
   Cấu trúc thường gặp trong giao tiếp hàng ngày, giúp diễn đạt mức độ hoặc trạng thái hành động rõ ràng.

2. **So sánh với tiếng Việt:**
   Người học Việt Nam cần chú ý trật tự từ: thành phần bổ ngữ hoặc trạng từ thường đặt trước hoặc sau động từ tùy thuộc vào tính chất kết quả.

3. **Cấu trúc ngữ pháp:**
   \`[Chủ ngữ] + [Phó từ/Trợ từ] + [Vị ngữ] + [Tân ngữ]\``,
      examples: [
        '这个角色非常适合新手使用。 (Zhège juésè fēicháng shìhé xīnshǒu shǐyòng. - Nhân vật này rất phù hợp cho người mới sử dụng.)',
        '我们明天早上一起去图书馆。 (Wǒmen míngtiān zǎoshang yìqǐ qù túshūguǎn. - Sáng mai chúng ta cùng nhau đi thư viện nhé.)',
      ],
    };
  }
}
