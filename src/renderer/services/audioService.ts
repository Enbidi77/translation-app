class SoundManager {
  private currentAudio: HTMLAudioElement | null = null;
  private activeUtterances: Set<SpeechSynthesisUtterance> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Warm up voice list
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }

  public stopAll(): void {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (_) {}
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
      this.activeUtterances.clear();
    }
  }

  public isCurrentlyPlaying(): boolean {
    return Boolean(this.currentAudio && !this.currentAudio.paused) || (typeof window !== 'undefined' && window.speechSynthesis?.speaking);
  }

  public async playText(
    text: string,
    lang: string = 'zh',
    slow: boolean = false,
    onStatusChange?: (status: 'loading' | 'playing' | 'idle') => void
  ): Promise<void> {
    const trimmed = (text || '').trim();
    if (!trimmed) {
      onStatusChange?.('idle');
      return;
    }

    this.stopAll();
    onStatusChange?.('loading');

    // Normalize language
    let normalizedLang = lang;
    if (lang === 'zh' || lang === 'zh-CN') normalizedLang = 'zh-CN';
    else if (lang === 'en' || lang === 'en-US') normalizedLang = 'en';
    else if (lang === 'vi' || lang === 'vi-VN') normalizedLang = 'vi';
    else if (/[\u4e00-\u9fa5]/.test(trimmed)) normalizedLang = 'zh-CN';
    else if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(trimmed)) normalizedLang = 'vi';

    // 1. Primary: High-fidelity natural TTS via Electron IPC
    if (window.electronAPI?.synthesizeSpeech) {
      try {
        const res = await window.electronAPI.synthesizeSpeech({
          text: trimmed,
          lang: normalizedLang,
          slow,
        });

        if (res.success && res.audioData) {
          const audio = new Audio(res.audioData);
          this.currentAudio = audio;
          if (slow) {
            audio.playbackRate = 0.8;
          }

          return await new Promise<void>((resolve) => {
            let isResolved = false;
            const finish = () => {
              if (!isResolved) {
                isResolved = true;
                this.currentAudio = null;
                onStatusChange?.('idle');
                resolve();
              }
            };

            audio.onplay = () => onStatusChange?.('playing');
            audio.onended = finish;
            audio.onerror = (e) => {
              console.warn('[SoundManager] Audio play error, falling back to speech synthesis:', e);
              this.fallbackSpeechSynthesis(trimmed, normalizedLang, slow, onStatusChange).then(resolve);
            };

            audio.play().catch((err) => {
              console.warn('[SoundManager] audio.play() promise rejected, falling back:', err);
              this.fallbackSpeechSynthesis(trimmed, normalizedLang, slow, onStatusChange).then(resolve);
            });
          });
        }
      } catch (err) {
        console.warn('[SoundManager] IPC TTS call error, falling back:', err);
      }
    }

    // 2. Fallback: Browser Web Speech API SpeechSynthesis
    await this.fallbackSpeechSynthesis(trimmed, normalizedLang, slow, onStatusChange);
  }

  private async fallbackSpeechSynthesis(
    text: string,
    lang: string,
    slow: boolean,
    onStatusChange?: (status: 'loading' | 'playing' | 'idle') => void
  ): Promise<void> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onStatusChange?.('idle');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch (_) {}

    const utterance = new SpeechSynthesisUtterance(text);
    // Keep reference in persistent Set to prevent Chromium V8 garbage collection bug
    this.activeUtterances.add(utterance);

    const voices = window.speechSynthesis.getVoices();
    let bestVoice: SpeechSynthesisVoice | undefined;

    if (lang.startsWith('zh')) {
      utterance.lang = 'zh-CN';
      bestVoice = voices.find(
        (v) => v.lang.startsWith('zh') || /chinese|mandarin|huihui|yaoyao|han/i.test(v.name)
      );
    } else if (lang.startsWith('en')) {
      utterance.lang = 'en-US';
      bestVoice = voices.find(
        (v) => v.lang.startsWith('en') || /english|david|zira|mark|natural/i.test(v.name)
      );
    } else {
      utterance.lang = 'vi-VN';
      bestVoice = voices.find(
        (v) => v.lang.startsWith('vi') || /vietnamese|an|mai/i.test(v.name)
      );
    }

    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.rate = slow ? 0.75 : 1.0;

    return new Promise<void>((resolve) => {
      let isResolved = false;
      const finish = () => {
        if (!isResolved) {
          isResolved = true;
          this.activeUtterances.delete(utterance);
          onStatusChange?.('idle');
          resolve();
        }
      };

      utterance.onstart = () => onStatusChange?.('playing');
      utterance.onend = finish;
      utterance.onerror = (e) => {
        console.warn('[SoundManager] SpeechSynthesis error:', e);
        finish();
      };

      window.speechSynthesis.speak(utterance);

      // Failsafe timeout in case Chromium stalls
      setTimeout(() => {
        if (!isResolved && this.activeUtterances.has(utterance)) {
          finish();
        }
      }, 10000);
    });
  }
}

export const soundManager = new SoundManager();
