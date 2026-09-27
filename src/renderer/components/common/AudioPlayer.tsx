import React, { useState } from 'react';
import { Volume2, Volume1, Loader2 } from 'lucide-react';

interface AudioPlayerProps {
  text: string;
  lang?: 'zh' | 'en' | 'vi';
  slow?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  text,
  lang = 'zh',
  slow = false,
  size = 'md',
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const speak = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!text || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Stop any active playback

    const utterance = new SpeechSynthesisUtterance(text);
    if (lang === 'zh') {
      utterance.lang = 'zh-CN';
    } else if (lang === 'en') {
      utterance.lang = 'en-US';
    } else {
      utterance.lang = 'vi-VN';
    }

    utterance.rate = slow ? 0.75 : 1.0;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      type="button"
      onClick={speak}
      disabled={isPlaying}
      title={`Phát âm ${lang === 'zh' ? 'tiếng Trung' : lang === 'en' ? 'tiếng Anh' : 'tiếng Việt'}${slow ? ' (chậm)' : ''}`}
      className={`inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-primary transition-colors focus:outline-none ${className}`}
    >
      {isPlaying ? (
        <Loader2 className={`${iconSizes[size]} animate-spin text-primary`} />
      ) : slow ? (
        <Volume1 className={iconSizes[size]} />
      ) : (
        <Volume2 className={iconSizes[size]} />
      )}
    </button>
  );
};
