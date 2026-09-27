import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  AlertCircle, 
  Volume2, 
  BookOpen,
  MessageSquare
} from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useAppStore } from '../stores/useAppStore';
import { TonePinyin } from '../components/common/TonePinyin';
import { AudioPlayer } from '../components/common/AudioPlayer';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  pinyin?: string;
  vietnameseTranslation?: string;
  feedback?: string;
  suggestedReplies?: string[];
}

export const AiTutorPage: React.FC = () => {
  const { dict } = useSettingsStore();
  const { showToast } = useAppStore();

  const [topic, setTopic] = useState('Trò chơi & Giải trí (Gaming)');
  const [level, setLevel] = useState('Sơ - Trung cấp (HSK 3 / B1)');
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是你的中文学习助手。今天我们来聊聊你最喜欢的游戏或者日常爱好吧！你平时喜欢玩什么游戏？',
      pinyin: 'Nǐ hǎo! Wǒ shì nǐ de Zhōngwén xuéxí zhùshǒu. Jīntiān wǒmen lái liáoliao nǐ zuì xǐhuan de yóuxì huòzhě rìcháng àihào ba! Nǐ píngshí xǐhuan wán shénme yóuxì?',
      vietnameseTranslation: 'Xin chào! Tôi là trợ lý học tiếng Trung của bạn. Hôm nay chúng ta hãy cùng trò chuyện về tựa game yêu thích hoặc sở thích thường ngày của bạn nhé! Bạn thường thích chơi game gì?',
      suggestedReplies: [
        '我喜欢玩原神，因为它的画面很漂亮。',
        '我不常玩游戏，我更喜欢看电影。',
      ],
    },
  ]);

  const handleSendMessage = async (msgText = inputMessage) => {
    if (!msgText.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msgText.trim(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage('');
    setIsTyping(true);

    try {
      if (window.electronAPI) {
        const payload = newHistory.map((m) => ({ role: m.role, content: m.content }));
        const aiResponse = await window.electronAPI.chatWithAiTutor({
          messages: payload,
          topic,
          level,
        });

        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiResponse.reply || aiResponse,
          pinyin: aiResponse.pinyin,
          vietnameseTranslation: aiResponse.vietnameseTranslation,
          feedback: aiResponse.feedback,
          suggestedReplies: aiResponse.suggestedReplies,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      showToast(`Lỗi gửi tin nhắn AI: ${err.message}`, 'error');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            <span>{dict.aiTutor.title}</span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Luyện đàm thoại phản xạ 1:1, tự động phát hiện lỗi sai đặc trưng của người Việt.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none"
          >
            <option>Trò chơi & Giải trí (Gaming)</option>
            <option>Du lịch & Hỏi đường (Travel)</option>
            <option>Phỏng vấn xin việc (Job Interview)</option>
            <option>Đời sống hằng ngày (Daily Life)</option>
            <option>Mua sắm & Trả giá (Shopping)</option>
            <option>Công nghệ & Lập trình (Tech)</option>
          </select>

          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none"
          >
            <option>Cơ bản (HSK 1-2 / A1-A2)</option>
            <option>Sơ - Trung cấp (HSK 3 / B1)</option>
            <option>Trung - Cao cấp (HSK 4-5 / B2-C1)</option>
          </select>
        </div>
      </div>

      {/* Message Chat List */}
      <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 overflow-y-auto space-y-4 shadow-xl">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                m.role === 'user' ? 'bg-primary text-white' : 'bg-indigo-600 text-white'
              }`}
            >
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className={`space-y-2 max-w-[80%] ${m.role === 'user' ? 'items-end' : ''}`}>
              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed space-y-2 shadow-sm ${
                  m.role === 'user'
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-100 rounded-tl-none'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-base">{m.content}</div>
                  {m.role === 'assistant' && (
                    <AudioPlayer text={m.content} lang="zh" size="sm" />
                  )}
                </div>

                {m.pinyin && (
                  <div className="pt-1 border-t border-slate-800/80">
                    <TonePinyin pinyin={m.pinyin} className="text-xs" />
                  </div>
                )}

                {m.vietnameseTranslation && (
                  <div className="text-xs font-medium text-emerald-300/90 pt-0.5">
                    {m.vietnameseTranslation}
                  </div>
                )}
              </div>

              {/* AI Feedback on user language errors */}
              {m.feedback && (
                <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-200/90 flex items-start gap-2 shadow-sm">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300 block mb-0.5">Góp ý ngữ cảnh người Việt:</span>
                    <span>{m.feedback}</span>
                  </div>
                </div>
              )}

              {/* Suggested quick replies */}
              {m.suggestedReplies && m.suggestedReplies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {m.suggestedReplies.map((reply, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(reply)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition-colors"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1">Gia sư AI đang soạn câu trả lời...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Box Footer */}
      <div className="shrink-0 flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-2xl shadow-xl">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          placeholder={dict.aiTutor.inputPlaceholder}
          className="flex-1 bg-transparent px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputMessage.trim() || isTyping}
          className="px-4 py-2 rounded-xl bg-primary hover:bg-blue-600 text-white font-medium text-xs shadow disabled:opacity-50 transition-all flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{dict.aiTutor.sendBtn}</span>
        </button>
      </div>
    </div>
  );
};
