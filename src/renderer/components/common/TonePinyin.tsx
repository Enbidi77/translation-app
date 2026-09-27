import React from 'react';

interface TonePinyinProps {
  pinyin: string;
  className?: string;
  toneStyle?: 'marks' | 'numbers' | 'colorized';
}

export const TonePinyin: React.FC<TonePinyinProps> = ({
  pinyin,
  className = '',
  toneStyle = 'colorized',
}) => {
  if (!pinyin) return null;

  const getToneClass = (syllable: string) => {
    if (toneStyle !== 'colorized') return 'text-slate-300';
    if (/[āēīōūǖ]/.test(syllable)) return 'tone-1 font-medium';
    if (/[áéíóúǘ]/.test(syllable)) return 'tone-2 font-medium';
    if (/[ǎěǐǒǔǚ]/.test(syllable)) return 'tone-3 font-medium';
    if (/[àèìòùǜ]/.test(syllable)) return 'tone-4 font-medium';
    return 'tone-5';
  };

  const syllables = pinyin.split(/\s+/);

  return (
    <span className={`inline-flex flex-wrap gap-1 items-center ${className}`}>
      {syllables.map((syl, idx) => (
        <span key={idx} className={`${getToneClass(syl)} tracking-wide text-xs md:text-sm`}>
          {syl}
        </span>
      ))}
    </span>
  );
};
