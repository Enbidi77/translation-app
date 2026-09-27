import React, { useState, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  AlertCircle, 
  Volume2, 
  BookOpen,
  MessageSquare,
  Mic,
  MicOff,
  Loader2
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

  // Voice recording state
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

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

  const handleToggleVoiceInput = async () => {
    if (isVoiceRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setIsVoiceRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];
        if (blob.size < 600) return;

        setIsVoiceProcessing(true);
        try {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            const base64Data = reader.result as string;
            if (window.electronAPI?.transcribeAudio) {
              const res = await window.electronAPI.transcribeAudio({
                audioData: base64Data,
                mimeType,
                sourceLang: 'zh-CN',
                targetLang: 'vi',
              });
              if (res.success && res.transcript) {
                setInputMessage(res.transcript);
                showToast('Đã nhận diện giọng nói! Bấm Gửi để trò chuyện.', 'success');
              } else {
                showToast(res.error || 'Không nhận diện được giọng nói.', 'warning');
              }
            }
            setIsVoiceProcessing(false);
          };
        } catch (err) {
          setIsVoiceProcessing(false);
          showToast('Lỗi nhận diện âm thanh.', 'error');
        }
      };

      mediaRecorder.start();
      setIsVoiceRecording(true);
      showToast('Đang lắng nghe... Hãy nói tiếng Trung hoặc tiếng Anh!', 'info');
    } catch (err: any) {
      setIsVoiceRecording(false);
      showToast(`Không thể mở micro: ${err.message}`, 'error');
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            <span>{dict.aiTutor.title}</span>
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Luyện đàm thoại phản xạ 1:1, tự động phát hiện lỗi sai đặc trưng của người Việt.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="bg-card border border-border text-foreground rounded-2xl px-3 py-1.5 focus:outline-none focus:border-primary shadow-google-sm"
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
            className="bg-card border border-border text-foreground rounded-2xl px-3 py-1.5 focus:outline-none focus:border-primary shadow-google-sm"
          >
            <option>Cơ bản (HSK 1-2 / A1-A2)</option>
            <option>Sơ - Trung cấp (HSK 3 / B1)</option>
            <option>Trung - Cao cấp (HSK 4-5 / B2-C1)</option>
          </select>
        </div>
      </div>

      {/* Message Chat List */}
      <div className="flex-1 bg-card border border-border rounded-3xl p-5 overflow-y-auto space-y-4 shadow-google-md">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-google-sm ${
                m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-primary-muted text-primary border border-primary/30'
              }`}
            >
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className={`space-y-2 max-w-[80%] ${m.role === 'user' ? 'items-end' : ''}`}>
              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed space-y-2 shadow-google-sm ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-surface border border-border text-foreground rounded-tl-none'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-base">{m.content}</div>
                  {m.role === 'assistant' && (
                    <AudioPlayer text={m.content} lang="zh" size="sm" />
                  )}
                </div>

                {m.pinyin && (
                  <div className="pt-1.5 border-t border-border">
                    <TonePinyin pinyin={m.pinyin} className="text-xs" />
                  </div>
                )}

                {m.vietnameseTranslation && (
                  <div className="text-xs font-medium text-success pt-0.5">
                    {m.vietnameseTranslation}
                  </div>
                )}
              </div>

              {/* AI Feedback on user language errors */}
              {m.feedback && (
                <div className="p-3 bg-warning-muted border border-warning/30 rounded-2xl text-xs text-foreground flex items-start gap-2 shadow-google-sm">
                  <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-warning block mb-0.5">Góp ý ngữ cảnh người Việt:</span>
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
                      className="px-3 py-1 rounded-xl bg-surface-hover hover:bg-surface-active border border-border text-xs text-foreground transition-colors shadow-google-sm"
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
            <div className="w-8 h-8 rounded-xl bg-primary-muted text-primary border border-primary/30 flex items-center justify-center">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-surface border border-border text-xs text-muted-foreground flex items-center gap-1.5 shadow-google-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1">Gia sư AI đang soạn câu trả lời...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Box Footer */}
      <div className="shrink-0 flex items-center gap-2 bg-card border border-border p-2 rounded-2xl shadow-google-md">
        <button
          type="button"
          onClick={handleToggleVoiceInput}
          disabled={isVoiceProcessing || isTyping}
          className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all shadow-google-sm shrink-0 ${
            isVoiceProcessing
              ? 'bg-primary/20 text-primary border-primary/30'
              : isVoiceRecording
              ? 'bg-destructive text-destructive-foreground border-destructive animate-pulse'
              : 'bg-surface hover:bg-surface-hover text-foreground border-border hover:border-primary/40'
          }`}
          title={isVoiceRecording ? 'Bấm để dừng ghi và chuyển giọng nói thành văn bản' : 'Nói để trò chuyện cùng gia sư AI (Voice chat)'}
        >
          {isVoiceProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : isVoiceRecording ? (
            <MicOff className="w-4 h-4 text-destructive-foreground" />
          ) : (
            <Mic className="w-4 h-4 text-primary" />
          )}
        </button>

        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          placeholder={dict.aiTutor.inputPlaceholder}
          className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputMessage.trim() || isTyping}
          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs shadow-google-sm disabled:opacity-50 transition-all flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{dict.aiTutor.sendBtn}</span>
        </button>
      </div>
    </div>
  );
};
