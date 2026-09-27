import React, { useState, useEffect } from 'react';
import { Volume2, Volume1, Loader2, Square } from 'lucide-react';
import { soundManager } from '../../services/audioService';

interface AudioPlayerProps {
  text: string;
  lang?: 'zh' | 'en' | 'vi' | string;
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
  const [playbackStatus, setPlaybackStatus] = useState<'idle' | 'loading' | 'playing'>('idle');

  useEffect(() => {
    return () => {
      // If component unmounts while this audio was playing, we don't necessarily stop global audio unless needed
    };
  }, []);

  const handleClick = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!text) return;

    if (playbackStatus === 'playing' || playbackStatus === 'loading') {
      soundManager.stopAll();
      setPlaybackStatus('idle');
      return;
    }

    try {
      await soundManager.playText(text, lang, slow, (status) => {
        setPlaybackStatus(status);
      });
    } catch (err) {
      console.error('[AudioPlayer] Playback failed:', err);
      setPlaybackStatus('idle');
    }
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const getLanguageName = (l: string) => {
    if (l.startsWith('zh')) return 'tiếng Trung';
    if (l.startsWith('en')) return 'tiếng Anh';
    if (l.startsWith('vi')) return 'tiếng Việt';
    return l;
  };

  const tooltip = playbackStatus === 'playing'
    ? 'Đang phát âm... (Bấm để dừng)'
    : playbackStatus === 'loading'
    ? 'Đang tải âm thanh...'
    : `Phát âm ${getLanguageName(lang)}${slow ? ' (tốc độ chậm)' : ''}`;

  return (
    <button
      type="button"
      onClick={handleClick}
      title={tooltip}
      className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-all focus:outline-none ${
        playbackStatus === 'playing'
          ? 'bg-primary-muted text-primary border border-primary/30 shadow-google-sm'
          : playbackStatus === 'loading'
          ? 'bg-surface-hover text-primary'
          : 'hover:bg-surface-hover text-muted-foreground hover:text-primary'
      } ${className}`}
    >
      {playbackStatus === 'loading' ? (
        <Loader2 className={`${iconSizes[size]} animate-spin text-primary`} />
      ) : playbackStatus === 'playing' ? (
        <Volume2 className={`${iconSizes[size]} animate-pulse text-primary`} />
      ) : slow ? (
        <Volume1 className={iconSizes[size]} />
      ) : (
        <Volume2 className={iconSizes[size]} />
      )}
    </button>
  );
};
