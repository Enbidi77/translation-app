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
    else if (lang === 'ja' || lang === 'ja-JP') normalizedLang = 'ja';
    else if (lang === 'ko' || lang === 'ko-KR') normalizedLang = 'ko';
    else if (lang === 'fr' || lang === 'fr-FR') normalizedLang = 'fr';
    else if (lang === 'de' || lang === 'de-DE') normalizedLang = 'de';
    else if (lang === 'es' || lang === 'es-ES') normalizedLang = 'es';
    else if (lang === 'ru' || lang === 'ru-RU') normalizedLang = 'ru';
    else if (/[\u3040-\u30ff]/.test(trimmed)) normalizedLang = 'ja';
    else if (/[\uac00-\ud7af]/.test(trimmed)) normalizedLang = 'ko';
    else if (/[\u4e00-\u9fa5]/.test(trimmed)) normalizedLang = 'zh-CN';
    else if (/[\u0400-\u04ff]/.test(trimmed)) normalizedLang = 'ru';
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

    let bcp47 = 'en-US';
    if (lang.startsWith('zh')) bcp47 = 'zh-CN';
    else if (lang.startsWith('vi')) bcp47 = 'vi-VN';
    else if (lang.startsWith('ja')) bcp47 = 'ja-JP';
    else if (lang.startsWith('ko')) bcp47 = 'ko-KR';
    else if (lang.startsWith('fr')) bcp47 = 'fr-FR';
    else if (lang.startsWith('de')) bcp47 = 'de-DE';
    else if (lang.startsWith('es')) bcp47 = 'es-ES';
    else if (lang.startsWith('ru')) bcp47 = 'ru-RU';
    else if (lang.startsWith('en')) bcp47 = 'en-US';

    utterance.lang = bcp47;
    const prefix = bcp47.split('-')[0].toLowerCase();

    bestVoice = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
    if (!bestVoice && voices.length > 0) {
      bestVoice = voices.find((v) => v.lang.toLowerCase().includes(prefix));
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
