import React, { useState, useRef } from 'react';
import { 
  Headphones, 
  Mic, 
  MicOff, 
  Play, 
  Check, 
  Sparkles, 
  Volume2, 
  RotateCcw,
  Award,
  Lock,
} from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useAppStore } from '../stores/useAppStore';
import { TonePinyin } from '../components/common/TonePinyin';
import { AudioPlayer } from '../components/common/AudioPlayer';
import { useFeatureFlags } from '../useFeatureFlags';
import { FeatureGate } from '../FeatureGate';

export const PracticePage: React.FC = () => {
  const { dict } = useSettingsStore();
  const { showToast } = useAppStore();
  const { isPracticeSpeakingEnabled } = useFeatureFlags();

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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const handleStartSpeaking = async () => {
    if (isRecording) {
      // User is stopping the recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setIsRecording(false);
      showToast('Đang chấm điểm phát âm...', 'info');
      return;
    }

    // User is starting the recording
    setSpokenTranscript('');
    setSpeechEvaluation(null);

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

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];

        if (blob.size < 500) {
          showToast('Đoạn ghi âm quá ngắn. Vui lòng nói to rõ hơn!', 'warning');
          return;
        }

        setIsEvaluating(true);
        try {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            const base64Data = reader.result as string;
            let recognizedText = '';

            if (window.electronAPI?.transcribeAudio) {
              const res = await window.electronAPI.transcribeAudio({
                audioData: base64Data,
                mimeType,
                sourceLang: 'zh-CN',
                targetLang: 'vi',
              });
              if (res.success && res.transcript) {
                recognizedText = res.transcript;
                setSpokenTranscript(recognizedText);
              }
            }

            // Evaluate speech against target sentence
            if (window.electronAPI?.evaluateSpeech) {
              const evalRes = await window.electronAPI.evaluateSpeech({
                targetText: speakSentence.chinese,
                spokenText: recognizedText || speakSentence.chinese,
                lang: 'zh',
              });
              setSpeechEvaluation(evalRes);
            }
            setIsEvaluating(false);
          };
        } catch (err) {
          console.error('Speech evaluation failed:', err);
          setIsEvaluating(false);
          showToast('Lỗi khi chấm điểm phát âm.', 'error');
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      showToast('Đang ghi âm... Nhấn lại vào nút khi đọc xong câu!', 'info');
    } catch (err: any) {
      console.error('Failed to access microphone in practice:', err);
      setIsRecording(false);
      showToast(`Không thể mở micro: ${err.message}`, 'error');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto overflow-y-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{dict.practice.title}</h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          Luyện nghe chép chính tả và luyện nói sửa phát âm phản hồi tức thì từ AI.
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex items-center gap-2 bg-card border border-border p-1 rounded-2xl w-fit text-xs font-semibold shadow-google-sm">
        <button
          onClick={() => setActiveTab('listen')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'listen' 
              ? 'bg-primary text-primary-foreground shadow-google-sm font-semibold' 
              : 'text-foreground-secondary hover:text-foreground hover:bg-surface-hover'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>{dict.practice.listenTab}</span>
        </button>
        <button
          onClick={() => setActiveTab('speak')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'speak' 
              ? 'bg-primary text-primary-foreground shadow-google-sm font-semibold' 
              : 'text-foreground-secondary hover:text-foreground hover:bg-surface-hover'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>{dict.practice.speakTab}</span>
          {!isPracticeSpeakingEnabled && (
            <span title="Cần Gemini hoặc OpenAI API Key" className="p-0.5 rounded-full bg-warning-muted text-warning">
              <Lock className="w-3 h-3" />
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Listening Dictation */}
      {activeTab === 'listen' && (
        <div className="p-6 bg-card border border-border rounded-3xl space-y-6 shadow-google-md">
          <div className="flex flex-col items-center justify-center p-8 bg-surface rounded-2xl border border-border space-y-4 shadow-google-sm">
            <div className="flex items-center gap-3">
              <AudioPlayer text={listenSentence.chinese} lang="zh" size="lg" />
              <AudioPlayer text={listenSentence.chinese} lang="zh" slow size="md" />
            </div>
            <p className="text-xs text-muted-foreground">Bấm vào biểu tượng loa để nghe câu phát âm tốc độ thường hoặc chậm</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Gõ lại những gì bạn nghe được (Hán tự hoặc Pinyin):</label>
            <input
              type="text"
              value={userTyped}
              onChange={(e) => setUserTyped(e.target.value)}
              placeholder="Gõ văn bản tiếng Trung tại đây..."
              className="w-full bg-surface border border-border rounded-xl p-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-google-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setUserTyped('');
                setListenSubmitted(false);
                setListenScore(null);
              }}
              className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-hover text-foreground-secondary hover:text-foreground border border-border text-xs font-medium transition-colors"
            >
              Làm lại
            </button>
            <button
              onClick={handleCheckListening}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs shadow-google-sm transition-all"
            >
              {dict.practice.checkAnswer}
            </button>
          </div>

          {/* Feedback & Result */}
          {listenSubmitted && (
            <div className="p-5 bg-surface rounded-2xl border border-border space-y-3 shadow-google-sm animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Đáp án chính xác:</span>
                <span className="text-sm font-bold text-primary">Điểm: {listenScore}%</span>
              </div>
              <div className="text-xl font-bold text-foreground">{listenSentence.chinese}</div>
              <TonePinyin pinyin={listenSentence.pinyin} className="text-xs" />
              <div className="text-xs font-medium text-success">{listenSentence.meaning}</div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Speaking & Pronunciation Practice (Gated by Feature Flag) */}
      {activeTab === 'speak' && (
        <FeatureGate
          feature="practiceSpeaking"
          title="Luyện Nói Phát Âm Trực Tiếp Với AI"
          description="Tính năng nhận diện giọng nói và chấm điểm phát âm tương tác cần có Gemini API Key hoặc OpenAI API Key."
        >
          <div className="p-6 bg-card border border-border rounded-3xl space-y-6 shadow-google-md">
            {/* Target Sentence Card */}
            <div className="p-6 bg-surface rounded-2xl border border-border space-y-2 shadow-google-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Câu luyện nói mẫu:</span>
                <div className="flex items-center gap-1">
                  <AudioPlayer text={speakSentence.chinese} lang="zh" size="sm" />
                  <AudioPlayer text={speakSentence.chinese} lang="zh" slow size="sm" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">{speakSentence.chinese}</div>
              <TonePinyin pinyin={speakSentence.pinyin} className="text-sm" />
              <div className="text-xs font-medium text-success">{speakSentence.meaning}</div>
            </div>

            {/* Record Button */}
            <div className="flex flex-col items-center justify-center p-6 space-y-3">
              <button
                onClick={handleStartSpeaking}
                disabled={isRecording || isEvaluating}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-google-lg transition-all ${
                  isRecording
                    ? 'bg-destructive text-destructive-foreground animate-pulse'
                    : 'bg-primary hover:bg-primary-hover text-primary-foreground'
                }`}
              >
                {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </button>
              <span className="text-xs text-muted-foreground font-medium">
                {isRecording ? 'Đang lắng nghe phát âm của bạn...' : isEvaluating ? dict.practice.evaluating : dict.practice.startSpeaking}
              </span>
            </div>

            {/* User Spoken Result & Evaluation */}
            {spokenTranscript && (
              <div className="p-5 bg-surface rounded-2xl border border-border space-y-3 shadow-google-sm animate-in fade-in duration-200">
                <div className="text-xs font-semibold text-muted-foreground">Bạn đã nói:</div>
                <div className="text-lg font-bold text-foreground leading-snug">"{spokenTranscript}"</div>

                {speechEvaluation && (
                  <div className="pt-3 border-t border-border space-y-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-warning" />
                      <span className="text-sm font-bold text-foreground">Điểm phát âm: {speechEvaluation.score} / 100</span>
                    </div>
                    <p className="text-xs text-foreground-secondary bg-surface-hover p-3 rounded-xl border border-border leading-relaxed">
                      {speechEvaluation.feedback}
                    </p>
                    {speechEvaluation.naturalAlternative && (
                      <div className="text-xs text-muted-foreground">
                        Cách nói tự nhiên hơn: <span className="text-success font-medium">{speechEvaluation.naturalAlternative}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </FeatureGate>
      )}
    </div>
  );
};
