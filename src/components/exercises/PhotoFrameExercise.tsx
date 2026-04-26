import { useState, useEffect } from 'react';
import type { VocabularyDto } from '../../services/api/patient-exercises.api';
import { ChevronLeft, ChevronRight, Volume2, Sparkles, Heart } from 'lucide-react'; // Removed Trophy from imports

interface PhotoFrameExerciseProps {
  vocabulary: VocabularyDto[];
  currentRepetition: number;
  totalRepetitions: number;
  onRepetitionComplete: () => Promise<void>;
  onExerciseComplete: () => Promise<void>;
  isCompleted?: boolean;
  onPracticeAgain?: () => void;
}

export function PhotoFrameExercise({
  vocabulary,
  currentRepetition,
  totalRepetitions,
  onRepetitionComplete,
  onExerciseComplete,
  isCompleted = false,
  onPracticeAgain,
}: PhotoFrameExerciseProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stars, setStars] = useState<number[]>([]);
  const [hearts] = useState<number>(5); // Removed setHearts since it's not used

  const currentWord = vocabulary[currentWordIndex];
  const baseUrl = 'http://localhost:5246';

  const getAssetUrl = (url?: string) => {
    if (!url) return undefined;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${encodeURI(path)}`;
  };

  // Initialize stars for completed exercise
  useEffect(() => {
    if (isCompleted) {
      // Award stars based on performance (you can adjust this logic)
      const earnedStars = Math.min(5, vocabulary.length);
      setStars(Array.from({ length: earnedStars }, (_, i) => i + 1));
    }
  }, [isCompleted, vocabulary.length]);

  
const handlePlay = () => {
    const audioUrl = getAssetUrl(currentWord?.soundUrl);
    if (!audioUrl) return;

    try {
    
    // Preload the audio
    audio.preload = 'auto';
    audio.load();
    
    // Handle audio events
    const handleCanPlay = () => {
      setIsPlaying(true);
      audio.play().catch(error => {
        console.error('Audio play failed:', error);
        setIsPlaying(false);
      });
    };

    const handleEnded = () => {
      setIsPlaying(false);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };

    const handleError = (error: any) => {
      console.error('Audio error:', error);
      setIsPlaying(false);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
  } catch (error) {
    console.error('Audio initialization error:', error);
    setIsPlaying(false);
  }
};
  const handleNext = () => {
    if (currentWordIndex < vocabulary.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      // Add positive feedback
      if (Math.random() > 0.7) {
        setStars(prev => [...prev, prev.length + 1]);
      }
    }
  };

  const handlePrevious = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
    }
  };

  const handleSubmitRepetition = async () => {
    setIsSubmitting(true);
    try {
      // Show celebration animation
      if (currentRepetition === totalRepetitions) {
        // Last repetition - big celebration
        setTimeout(() => {
          setIsSubmitting(false);
          onExerciseComplete();
        }, 1000);
      } else {
        await onRepetitionComplete();
        setCurrentWordIndex(0);
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Failed to submit repetition:', err);
      setIsSubmitting(false);
    }
  };

  const isLastWord = currentWordIndex === vocabulary.length - 1;
  const progress = ((currentWordIndex + 1) / vocabulary.length) * 100;

  if (isCompleted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-purple-50 px-4 py-10">
        <div className="mx-auto w-full max-w-2xl text-center">
          {/* Celebration Animation */}
          <div className="mb-8 animate-bounce">
            <div className="relative">
              <div className="text-8xl mb-4">🎉🏆🎊</div>
              <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-500 animate-spin" />
              <Sparkles className="absolute -bottom-2 -left-2 w-8 h-8 text-pink-500 animate-spin" />
            </div>
          </div>

          {/* Congratulations Message */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Amazing Job! 🎉
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            You've completed all {totalRepetitions} repetitions!
          </p>

          {/* Stars Earned */}
          <div className="mb-8">
            <p className="text-lg font-semibold text-gray-700 mb-3">Stars Earned:</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <div
                  key={star}
                  className={`w-10 h-10 ${
                    stars.includes(star)
                      ? 'text-yellow-500 animate-pulse'
                      : 'text-gray-300'
                  }`}
                >
                  {stars.includes(star) ? '⭐' : '☆'}
                </div>
              ))}
            </div>
          </div>

          {/* Fun Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="rounded-2xl bg-gradient-to-r from-blue-100 to-cyan-100 p-6">
              <div className="text-3xl font-bold text-blue-600">{vocabulary.length}</div>
              <div className="text-sm text-blue-700">Words Learned</div>
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-purple-100 to-pink-100 p-6">
              <div className="text-3xl font-bold text-purple-600">{totalRepetitions}</div>
              <div className="text-sm text-purple-700">Repetitions Done</div>
            </div>
          </div>

          {/* Practice Again Button */}
          {onPracticeAgain && (
            <button
              onClick={onPracticeAgain}
              className="group relative overflow-hidden rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-10 py-4 text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3 mx-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/20 group-hover:to-pink-600/20 transition-all duration-300" />
              <Sparkles className="w-6 h-6" />
              Play Again!
              <Sparkles className="w-6 h-6" />
            </button>
          )}

          <p className="text-gray-500 mt-6 text-sm">
            You can practice as many times as you want! 😊
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-purple-50 px-4 py-6">
      <div className="mx-auto w-full max-w-2xl">
        {/* Header with lives and progress */}
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Repetition {currentRepetition} of {totalRepetitions}
              </h2>
              <p className="mt-1 text-blue-100">
                Word {currentWordIndex + 1} of {vocabulary.length}
              </p>
            </div>
            
            {/* Lives/Hearts */}
            <div className="flex items-center gap-1">
              {[...Array(hearts)].map((_, i) => (
                <Heart key={i} className="w-6 h-6 fill-red-400 text-red-500 animate-pulse" />
              ))}
            </div>
          </div>

          {/* Fun Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Your Progress</span>
              <span className="font-bold">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-500 shadow-lg"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 w-4 h-4 bg-white rounded-full -mt-0.5 -mr-2 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative">
          {/* Decorative Elements */}
          <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-pink-300/20 blur-sm" />
          <div className="absolute -bottom-4 -right-4 w-8 h-8 rounded-full bg-blue-300/20 blur-sm" />

          <div className="relative bg-white rounded-3xl p-8 shadow-2xl border-4 border-white">
            {/* Word Display */}
            {currentWord ? (
              <div className="flex flex-col items-center gap-8">
                {/* Fun Frame around Image */}
                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 to-purple-400 blur-lg opacity-50 animate-pulse" />
                  <div className="relative bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-4">
                    {currentWord.imageUrl ? (
                      <div className="overflow-hidden rounded-xl">
                        <img
                          src={getAssetUrl(currentWord.imageUrl)}
                          alt={currentWord.wordEnglish}
                          className="w-64 h-64 object-cover rounded-xl transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="w-64 h-64 rounded-xl bg-gradient-to-br from-blue-200 to-purple-200 flex items-center justify-center">
                        <div className="text-6xl">🎯</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Play Button */}
                <button
                  onClick={handlePlay}
                  disabled={!currentWord.soundUrl}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
                    currentWord.soundUrl
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:scale-110 hover:rotate-12 active:scale-95'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {isPlaying ? (
                    <div className="text-white text-3xl">🎵</div>
                  ) : (
                    <Volume2 className="w-8 h-8 text-white" />
                  )}
                  {isPlaying && (
                    <div className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-ping" />
                  )}
                </button>

                {/* Word Display */}
                <div className="text-center space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Say it loud! 🔊</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {currentWord.wordEnglish}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-2">In Arabic:</p>
                    <p className="text-3xl font-semibold text-gray-800" dir="rtl">
                      {currentWord.wordArabic}
                    </p>
                  </div>

                  {/* Fun Prompt */}
                  <p className="text-lg text-gray-600 mt-4 italic">
                    "Can you say it <span className="text-yellow-500 font-bold">3 times</span>? Let's go! 🚀"
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-600">No word found!</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentWordIndex === 0}
            className={`flex items-center gap-2 rounded-full px-6 py-3 font-bold transition-all ${
              currentWordIndex > 0
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                : 'cursor-not-allowed bg-gray-200 text-gray-400'
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
            Previous
          </button>

          {/* Word Counter */}
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {currentWordIndex + 1} / {vocabulary.length}
            </div>
            <div className="text-sm text-gray-500">Words</div>
          </div>

          <button
            onClick={handleNext}
            disabled={isLastWord}
            className={`flex items-center gap-2 rounded-full px-6 py-3 font-bold transition-all ${
              !isLastWord
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                : 'cursor-not-allowed bg-gray-200 text-gray-400'
            }`}
          >
            Next
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Submit Button */}
        {isLastWord && (
          <div className="mt-8 text-center">
            <button
              onClick={handleSubmitRepetition}
              disabled={isSubmitting}
              className={`group relative overflow-hidden rounded-full px-10 py-4 text-lg font-bold shadow-xl transition-all duration-300 ${
                !isSubmitting
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-2xl hover:scale-105'
                  : 'cursor-not-allowed bg-gray-300 text-gray-500'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-emerald-600/20" />
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </div>
                </>
              ) : currentRepetition === totalRepetitions ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600/0 to-emerald-600/0 group-hover:from-green-600/20 group-hover:to-emerald-600/20 transition-all duration-300" />
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏆</span>
                    Complete Mission! 🎉
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/0 to-orange-600/0 group-hover:from-yellow-600/20 group-hover:to-orange-600/20 transition-all duration-300" />
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Go to Repetition {currentRepetition + 1}!
                  </div>
                </>
              )}
            </button>

            <p className="mt-3 text-sm text-gray-600">
              {currentRepetition === totalRepetitions
                ? 'Last repetition! You did amazing! 🎉'
                : `You're doing great! Keep going! 💪`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}