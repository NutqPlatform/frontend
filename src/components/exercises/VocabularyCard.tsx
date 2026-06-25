import { useState } from 'react';
import type { VocabularyDto } from '../../services/api/patient-exercises.api';
import { Volume2, Sparkles } from 'lucide-react';

interface VocabularyCardProps {
  word: VocabularyDto;
  index: number;
  isCompleted?: boolean;
}

export function VocabularyCard({ word, index, isCompleted = false }: VocabularyCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const baseUrl = 'https://backend-production-cae8.up.railway.app';

  const getAssetUrl = (url?: string) => {
    if (!url) return undefined;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${encodeURI(path)}`;
  };

  const handlePlay = () => {
    const audioUrl = getAssetUrl(word.soundUrl);
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    setIsPlaying(true);
    audio.play();
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
  };

  return (
    <div 
      className={`group relative overflow-hidden rounded-3xl border-4 transition-all duration-300 hover:scale-105 ${
        isCompleted 
          ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50' 
          : 'border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50'
      } shadow-lg hover:shadow-2xl`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Decorative Corner */}
      {isCompleted && (
        <div className="absolute top-2 right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
          <span className="text-white text-sm">✓</span>
        </div>
      )}

      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden">
        {word.imageUrl ? (
          <img
            src={getAssetUrl(word.imageUrl)}
            alt={word.wordEnglish}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-7xl">🌈</div>
          </div>
        )}
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handlePlay}
            disabled={!word.soundUrl}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-300 ${
              word.soundUrl
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:scale-110 hover:rotate-12 active:scale-95'
                : 'cursor-not-allowed bg-gray-400'
            }`}
          >
            {isPlaying ? (
              <div className="text-white text-xl">🎵</div>
            ) : (
              <Volume2 className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Word Information */}
      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {word.wordEnglish}
            </h3>
            <div className="flex items-center gap-1">
              {[...Array(3)].map((_, i) => (
                <Sparkles 
                  key={i} 
                  className={`w-3 h-3 ${i < index % 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
          </div>
          <p className="text-xl text-gray-800" dir="rtl">
            {word.wordArabic}
          </p>
        </div>

        {/* Fun Tags */}
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700">
            Word #{index + 1}
          </span>
          {word.category && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700">
              {word.category}
            </span>
          )}
          {isCompleted && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-700">
              Learned! 🎉
            </span>
          )}
        </div>

        {/* Fun Prompt */}
        {isHovered && (
          <p className="mt-4 text-sm text-gray-600 animate-pulse">
            Click the play button to hear it! 🔊
          </p>
        )}
      </div>

      {/* Fun Animation Effect */}
      {isPlaying && (
        <div className="absolute inset-0 border-4 border-yellow-400 rounded-3xl animate-ping" />
      )}
    </div>
  );
}