import { useState, useEffect } from 'react';
import type { VocabularyDto } from '../../services/api/patient-exercises.api';
import { ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';

interface PhotoFrameExerciseProps {
  vocabulary: VocabularyDto[];
  currentRepetition: number;
  totalRepetitions: number;
  onRepetitionComplete: () => Promise<void>;
  onExerciseComplete: () => Promise<void>;
}

export function PhotoFrameExercise({
  vocabulary,
  currentRepetition,
  totalRepetitions,
  onRepetitionComplete,
  onExerciseComplete,
}: PhotoFrameExerciseProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentWord = vocabulary[currentWordIndex];
  const baseUrl = 'http://localhost:5246';

  const handlePlay = () => {
    if (!currentWord?.soundUrl) return;

    const audio = new Audio(`${baseUrl}${currentWord.soundUrl}`);
    setIsPlaying(true);
    audio.play();
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
  };

  const handleNext = () => {
    if (currentWordIndex < vocabulary.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
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
      // Move to next repetition or complete exercise
      if (currentRepetition < totalRepetitions) {
        await onRepetitionComplete();
        setCurrentWordIndex(0); // Reset to first word for next repetition
      } else {
        await onExerciseComplete();
      }
    } catch (err) {
      console.error('Failed to submit repetition:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLastWord = currentWordIndex === vocabulary.length - 1;
  const progress = ((currentWordIndex + 1) / vocabulary.length) * 100;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        {/* Header with repetition counter */}
        <div className="mb-8 flex items-center justify-between rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Repetition {currentRepetition} of {totalRepetitions}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Word {currentWordIndex + 1} of {vocabulary.length}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-sm font-medium text-slate-700">In Progress</span>
          </div>
        </div>

        {/* Progress bar for words in current repetition */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-slate-600">Words completed</span>
            <span className="font-medium text-slate-700">{progress.toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Main photo frame */}
        <div className="mb-8 rounded-xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
          {currentWord ? (
            <div className="flex flex-col items-center gap-6">
              {/* Image */}
              <div className="aspect-square w-full max-w-sm overflow-hidden rounded-lg bg-slate-100">
                {currentWord.imageUrl ? (
                  <img
                    src={`${baseUrl}${currentWord.imageUrl}`}
                    alt={currentWord.wordEnglish}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-8xl">
                    🎯
                  </div>
                )}
              </div>

              {/* Word Information */}
              <div className="w-full text-center">
                <p className="text-sm text-slate-500">English</p>
                <p className="text-3xl font-bold text-slate-900">
                  {currentWord.wordEnglish}
                </p>

                <p className="mt-4 text-sm text-slate-500">Arabic</p>
                <p className="text-2xl font-semibold text-slate-700" dir="rtl">
                  {currentWord.wordArabic}
                </p>
              </div>

              {/* Play button */}
              <button
                onClick={handlePlay}
                disabled={!currentWord.soundUrl || isPlaying}
                className={`flex items-center gap-2 rounded-full px-6 py-3 text-lg font-semibold shadow-md transition-all ${
                  currentWord.soundUrl && !isPlaying
                    ? 'bg-amber-500 text-white hover:scale-105 hover:bg-amber-600 active:scale-95'
                    : 'cursor-not-allowed bg-slate-300 text-slate-500'
                }`}
              >
                <Volume2 className="h-5 w-5" />
                {isPlaying ? 'Playing...' : 'Play Pronunciation'}
              </button>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-slate-600">No vocabulary available</p>
            </div>
          )}
        </div>

        {/* Navigation controls */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentWordIndex === 0}
            className={`flex items-center gap-2 rounded-lg px-4 py-3 font-medium transition-all ${
              currentWordIndex > 0
                ? 'bg-white text-slate-900 shadow-sm hover:bg-slate-50 ring-1 ring-slate-200'
                : 'cursor-not-allowed bg-slate-100 text-slate-400 ring-1 ring-slate-200'
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
            Previous
          </button>

          <div className="text-center text-sm font-medium text-slate-600">
            {currentWordIndex + 1} / {vocabulary.length}
          </div>

          <button
            onClick={handleNext}
            disabled={currentWordIndex === vocabulary.length - 1}
            className={`flex items-center gap-2 rounded-lg px-4 py-3 font-medium transition-all ${
              currentWordIndex < vocabulary.length - 1
                ? 'bg-white text-slate-900 shadow-sm hover:bg-slate-50 ring-1 ring-slate-200'
                : 'cursor-not-allowed bg-slate-100 text-slate-400 ring-1 ring-slate-200'
            }`}
          >
            Next
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Submit button - only enabled when on last word */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmitRepetition}
            disabled={!isLastWord || isSubmitting}
            className={`flex-1 rounded-lg px-6 py-3 text-center font-semibold transition-all ${
              isLastWord && !isSubmitting
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] shadow-md'
                : 'cursor-not-allowed bg-slate-200 text-slate-500'
            }`}
          >
            {isSubmitting
              ? 'Submitting...'
              : currentRepetition === totalRepetitions
                ? 'Complete Exercise'
                : `Submit Repetition ${currentRepetition}`}
          </button>
        </div>

        {!isLastWord && (
          <p className="mt-4 text-center text-sm text-slate-600">
            Navigate through all words and click "Submit Repetition" on the last word to complete this repetition.
          </p>
        )}
      </div>
    </div>
  );
}
