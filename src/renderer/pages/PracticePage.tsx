import React, { useState } from 'react';
import { 
  Headphones, 
  Mic, 
  MicOff, 
  Play, 
  Check, 
  Sparkles, 
  Volume2, 
  RotateCcw,
  Award
} from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useAppStore } from '../stores/useAppStore';
import { TonePinyin } from '../components/common/TonePinyin';
import { AudioPlayer } from '../components/common/AudioPlayer';

export const PracticePage: React.FC = () => {
  const { dict } = useSettingsStore();
  const { showToast } = useAppStore();

  const [activeTab, setActiveTab] = useState<'listen' | 'speak'>('listen');

  // Listening Practice State
  const [listenSentence, setListenSentence] = useState({
    chinese: '这个角色非常适合新手使用。',
    pinyin: 'Zhège juésè fēicháng shìhé xīnshǒu shǐyòng.',
    meaning: 'Nhân vật này rất phù hợp cho người mới sử dụng.',
  });
  const [userTyped, setUserTyped] = useState('');
  const [listenSubmitted, setListenSubmitted] = useState(false);
  const [listenScore, setListenScore] = useState<number | null>(null);

  // Speaking Practice State
  const [speakSentence, setSpeakSentence] = useState({
    chinese: '这个游戏的操作非常简单。',
    pinyin: 'Zhège yóuxì de cāozuò fēicháng jiǎndān.',
    meaning: 'Cách điều khiển của game này rất đơn giản.',
  });
  const [isRecording, setIsRecording] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [speechEvaluation, setSpeechEvaluation] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleCheckListening = () => {
    if (!userTyped.trim()) return;
    const cleanTarget = listenSentence.chinese.replace(/[^\u4e00-\u9fa5]/g, '');
    const cleanInput = userTyped.replace(/[^\u4e00-\u9fa5]/g, '');

    let matches = 0;
    for (const char of cleanTarget) {
      if (cleanInput.includes(char)) matches++;
    }
    const score = cleanTarget.length > 0 ? Math.round((matches / cleanTarget.length) * 100) : 100;
    setListenScore(score);
    setListenSubmitted(true);
  };

  const handleStartSpeaking = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Trình duyệt không hỗ trợ nhận diện giọng nói.', 'warning');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
      setSpokenTranscript('');
      setSpeechEvaluation(null);
    };

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setSpokenTranscript(text);
      setIsRecording(false);

      // Evaluate pronunciation via AI
      setIsEvaluating(true);
      try {
        if (window.electronAPI) {
          const evalRes = await window.electronAPI.evaluateSpeech({
            targetText: speakSentence.chinese,
            spokenText: text,
            lang: 'zh',
          });
          setSpeechEvaluation(evalRes);
        }
      } catch (err) {
        console.error('Speech evaluation failed:', err);
      } finally {
        setIsEvaluating(false);
      }
    };

    recognition.onerror = () => {
      setIsRecording(false);
      showToast('Không bắt được giọng nói. Vui lòng thử lại!', 'warning');
    };

    recognition.start();
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto overflow-y-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{dict.practice.title}</h1>
        <p className="text-slate-400 text-xs mt-0.5">
          Luyện nghe chép chính tả và luyện nói sửa phát âm phản hồi tức thì từ AI.
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-2xl w-fit text-xs font-semibold">
        <button
          onClick={() => setActiveTab('listen')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'listen' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>{dict.practice.listenTab}</span>
        </button>
        <button
          onClick={() => setActiveTab('speak')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'speak' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>{dict.practice.speakTab}</span>
        </button>
      </div>

      {/* Tab 1: Listening Dictation */}
      {activeTab === 'listen' && (
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-6 shadow-xl">
          <div className="flex flex-col items-center justify-center p-8 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <AudioPlayer text={listenSentence.chinese} lang="zh" size="lg" />
              <AudioPlayer text={listenSentence.chinese} lang="zh" slow size="md" />
            </div>
            <p className="text-xs text-slate-400">Bấm vào biểu tượng loa để nghe câu phát âm tốc độ thường hoặc chậm</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Gõ lại những gì bạn nghe được (Hán tự hoặc Pinyin):</label>
            <input
              type="text"
              value={userTyped}
              onChange={(e) => setUserTyped(e.target.value)}
              placeholder="Gõ văn bản tiếng Trung tại đây..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-base text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setUserTyped('');
                setListenSubmitted(false);
                setListenScore(null);
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              Làm lại
            </button>
            <button
              onClick={handleCheckListening}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-blue-600 text-white font-medium text-xs shadow"
            >
              {dict.practice.checkAnswer}
            </button>
          </div>

          {/* Feedback & Result */}
          {listenSubmitted && (
            <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Đáp án chính xác:</span>
                <span className="text-sm font-bold text-primary">Điểm: {listenScore}%</span>
              </div>
              <div className="text-xl font-bold text-white">{listenSentence.chinese}</div>
              <TonePinyin pinyin={listenSentence.pinyin} className="text-xs" />
              <div className="text-xs font-medium text-emerald-300">{listenSentence.meaning}</div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Speaking & Pronunciation Practice */}
      {activeTab === 'speak' && (
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-6 shadow-xl">
          {/* Target Sentence Card */}
          <div className="p-6 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Câu luyện nói mẫu:</span>
              <div className="flex items-center gap-1">
                <AudioPlayer text={speakSentence.chinese} lang="zh" size="sm" />
                <AudioPlayer text={speakSentence.chinese} lang="zh" slow size="sm" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{speakSentence.chinese}</div>
            <TonePinyin pinyin={speakSentence.pinyin} className="text-sm" />
            <div className="text-xs font-medium text-emerald-300">{speakSentence.meaning}</div>
          </div>

          {/* Record Button */}
          <div className="flex flex-col items-center justify-center p-6 space-y-3">
            <button
              onClick={handleStartSpeaking}
              disabled={isRecording || isEvaluating}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-primary hover:bg-blue-600 text-white'
              }`}
            >
              {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
            <span className="text-xs text-slate-400 font-medium">
              {isRecording ? 'Đang lắng nghe phát âm của bạn...' : isEvaluating ? dict.practice.evaluating : dict.practice.startSpeaking}
            </span>
          </div>

          {/* User Spoken Result & Evaluation */}
          {spokenTranscript && (
            <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3 animate-in fade-in duration-200">
              <div className="text-xs font-semibold text-slate-400">Bạn đã nói:</div>
              <div className="text-lg font-bold text-white leading-snug">"{spokenTranscript}"</div>

              {speechEvaluation && (
                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <span className="text-sm font-bold text-white">Điểm phát âm: {speechEvaluation.score} / 100</span>
                  </div>
                  <p className="text-xs text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800 leading-relaxed">
                    {speechEvaluation.feedback}
                  </p>
                  {speechEvaluation.naturalAlternative && (
                    <div className="text-xs text-slate-400">
                      Cách nói tự nhiên hơn: <span className="text-emerald-300 font-medium">{speechEvaluation.naturalAlternative}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
