import { useState } from 'react';
import type { VocabularyDto } from '../../services/api/patient-exercises.api';

interface VocabularyCardProps {
  word: VocabularyDto;
  index: number;
}

export function VocabularyCard({ word, index }: VocabularyCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const baseUrl = 'http://localhost:5246';


const handlePlay = () => {
  if (!word.soundUrl) return;

  const audio = new Audio(`${baseUrl}${word.soundUrl}`);
  setIsPlaying(true);
  audio.play();
  audio.onended = () => setIsPlaying(false);
  audio.onerror = () => setIsPlaying(false);
};


  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-square bg-slate-100">
        {word.imageUrl ? (
          <img
          src={word.imageUrl ? `${baseUrl}${word.imageUrl}` : undefined}
          alt={word.wordEnglish}
          className="h-full w-full object-cover"
        />
        
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl text-slate-300">
            🍎
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
          <button
            onClick={handlePlay}
            disabled={!word.soundUrl}
            className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all ${
              word.soundUrl
                ? 'bg-amber-500 text-white hover:scale-110 hover:bg-amber-600 active:scale-95'
                : 'cursor-not-allowed bg-slate-300 text-slate-500'
            }`}
            title={word.soundUrl ? 'Play pronunciation' : 'No audio available'}
          >
            <svg
              className={`h-6 w-6 ${isPlaying ? 'animate-pulse' : ''}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <p className="text-2xl font-semibold text-slate-900">{word.wordEnglish}</p>
          <p className="mt-1 text-lg text-slate-600" dir="rtl">
            {word.wordArabic}
          </p>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Word {index + 1} {word.category && `• ${word.category}`}
        </p>
      </div>
    </div>
  );
}
