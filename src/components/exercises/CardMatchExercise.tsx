import { useEffect, useRef, useState } from 'react';
import type { VocabularyDto } from '../../services/api/patient-exercises.api';
import { Sparkles, Volume2 } from 'lucide-react';

interface CardMatchExerciseProps {
  vocabulary: VocabularyDto[];
  currentRepetition: number;
  totalRepetitions: number;
  onRepetitionComplete: () => Promise<void>;
  onExerciseComplete: () => Promise<void>;
  isCompleted?: boolean;
  onPracticeAgain?: () => void;
}

const BASE_URL = 'http://localhost:5246';

const getAssetUrl = (url?: string) => {
  if (!url) return undefined;
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${BASE_URL}${encodeURI(path)}`;
};

function playSuccessTone() {
  try {
    const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.18);
    oscillator.onended = () => audioCtx.close();
  } catch (error) {
    console.error('Success sound failed', error);
  }
}

function playNegativeTone(onEnd?: () => void) {
  try {
    const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) {
      onEnd?.();
      return;
    }
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = 220;
    gain.gain.setValueAtTime(0.14, audioCtx.currentTime);
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.22);
    oscillator.onended = () => {
      audioCtx.close();
      onEnd?.();
    };
  } catch (error) {
    console.error('Negative sound failed', error);
    onEnd?.();
  }
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export function CardMatchExercise({
  vocabulary,
  currentRepetition,
  totalRepetitions,
  onRepetitionComplete,
  onExerciseComplete,
  isCompleted = false,
  onPracticeAgain,
}: CardMatchExerciseProps) {
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [targetSequence, setTargetSequence] = useState<VocabularyDto[]>([]);
  const [roundCards, setRoundCards] = useState<VocabularyDto[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isCompleted || vocabulary.length === 0) {
      stopCurrentAudio();
      return;
    }

    const shuffledVocabulary = shuffle([...vocabulary]);
    setTargetSequence(shuffledVocabulary);
    setSequenceIndex(0);
  }, [vocabulary, currentRepetition, isCompleted]);

  const target = targetSequence[sequenceIndex] ?? null;

  useEffect(() => {
    if (!target) return;

    const distractors = shuffle(
      vocabulary.filter((item) => item.id !== target.id)
    ).slice(0, 2);

    setRoundCards(shuffle([target, ...distractors]));
    setSelectedCardId(null);
    setFeedback('Tap the card that matches the sound.');
    setIsCorrect(null);
    playSound();
  }, [target, vocabulary]);

  const isLastInSequence = sequenceIndex === targetSequence.length - 1;
  const isFinalRound = currentRepetition === totalRepetitions;

  const stopCurrentAudio = () => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current.src = '';
    audioRef.current = null;
    setIsPlaying(false);
  };

  const playSound = () => {
    stopCurrentAudio();

    const audioUrl = getAssetUrl(target?.soundUrl);
    if (!audioUrl) return;

    try {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.preload = 'auto';
      audio.load();
      setIsPlaying(true);

      const clearAudio = () => {
        if (audioRef.current === audio) {
          audioRef.current = null;
          setIsPlaying(false);
        }
      };

      audio.addEventListener('ended', clearAudio);
      audio.addEventListener('error', clearAudio);
      audio.play().catch(() => {
        clearAudio();
      });
    } catch (error) {
      console.error('Sound playback error:', error);
      setIsPlaying(false);
    }
  };

  const advanceRound = async () => {
    if (isAdvancing) return;
    setIsAdvancing(true);
    try {
      if (isLastInSequence) {
        if (currentRepetition < totalRepetitions) {
          await onRepetitionComplete();
        } else {
          await onExerciseComplete();
        }
      } else {
        setSequenceIndex((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Failed to advance round:', error);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleChoice = (choice: VocabularyDto) => {
    if (selectedCardId !== null && isCorrect) return;
    setSelectedCardId(choice.id);

    if (choice.id === target?.id) {
      setIsCorrect(true);
      setFeedback('Great job! Well done.');
      playSuccessTone();
      setTimeout(() => {
        advanceRound();
      }, 900);
    } else {
      setIsCorrect(false);
      setFeedback('Oops! Try again and choose the correct card.');
      playNegativeTone(() => {
        stopCurrentAudio();
        playSound();
      });
      setTimeout(() => {
        setSelectedCardId(null);
      }, 900);
    }
  };

  if (isCompleted) {
    const title = isFinalRound
      ? 'Amazing! You finished the card game.'
      : `Great job! You finished repetition ${currentRepetition}.`;

    const description = isFinalRound
      ? `You completed all ${totalRepetitions} fun exercises. Keep practicing to learn even more.`
      : `You completed repetition ${currentRepetition} of ${totalRepetitions}. Return to the plan to start the next one.`;

    const actionLabel = isFinalRound ? 'Back to plan' : 'Back to plan';

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-purple-50 px-4 py-10 text-center">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-10 shadow-2xl">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
          <p className="text-gray-600 mb-8">{description}</p>
          <div className="flex justify-center gap-3 mb-8">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="w-16 h-16 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center text-3xl text-white shadow-lg">
                ⭐
              </div>
            ))}
          </div>
          {onPracticeAgain && (
            <button
              onClick={onPracticeAgain}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-white font-semibold shadow-lg hover:opacity-95 transition-all"
            >
              <Sparkles className="w-5 h-5" /> {actionLabel}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-indigo-500 to-cyan-500 p-8 text-white shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold">Match the Sound!</h2>
              <p className="mt-2 text-indigo-100 max-w-2xl">
                Listen to the tool sound and tap the correct card. Match all {vocabulary.length} tools in this exercise.
              </p>
              <p className="mt-1 text-blue-100">
                Word {sequenceIndex + 1} of {targetSequence.length}
              </p>
            </div>
            <div className="rounded-3xl bg-white/15 px-5 py-4 text-center shadow-inner backdrop-blur-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-white/80">Exercise</p>
              <p className="text-4xl font-bold">{currentRepetition}/{totalRepetitions}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-500">Current target</p>
                  <h3 className="text-2xl font-semibold text-gray-900">{target?.wordEnglish}</h3>
                  <p className="text-gray-600">{target?.wordArabic}</p>
                </div>
                <button
                  onClick={playSound}
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-white font-semibold shadow-lg hover:bg-indigo-700 transition-all"
                >
                  <Volume2 className="w-5 h-5" /> Replay Sound
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {roundCards.map((card) => {
                const isSelected = selectedCardId === card.id;
                const isCorrectCard = isSelected && isCorrect;
                const isWrongCard = isSelected && isCorrect === false;

                return (
                  <button
                    key={card.id}
                    onClick={() => handleChoice(card)}
                    className={`group relative overflow-hidden rounded-3xl border p-4 text-left transition-all shadow-lg bg-white ${
                      isCorrectCard
                        ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-300 shadow-2xl scale-105 animate-pulse'
                        : isWrongCard
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-200 hover:-translate-y-1'
                    } ${isAdvancing ? 'pointer-events-none opacity-80' : ''}`}
                  >
                    <div className="relative mb-4 h-44 overflow-hidden rounded-3xl bg-slate-100">
                      {card.imageUrl ? (
                        <img
                          src={getAssetUrl(card.imageUrl)}
                          alt={card.wordEnglish}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-4xl text-gray-400">🎯</div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{card.wordEnglish}</p>
                        <p className="text-sm text-gray-500">{card.wordArabic}</p>
                      </div>
                      {isSelected && (
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isCorrectCard ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {isCorrectCard ? 'Correct' : 'Try again'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-inner border border-gray-200">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">Feedback</p>
                  <p className="text-lg font-semibold text-gray-900">{feedback}</p>
                </div>
                {isPlaying && <Sparkles className="h-6 w-6 text-indigo-500 animate-spin" />}
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all"
                  style={{ width: `${((sequenceIndex + 1) / targetSequence.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-2xl border border-gray-200">
              <p className="text-sm uppercase tracking-[0.16em] text-gray-500 mb-3">Mission</p>
              <div className="space-y-4">
                <div className="rounded-3xl bg-indigo-50 p-4">
                  <p className="text-sm text-indigo-600">Total Exercises</p>
                  <p className="text-3xl font-semibold text-gray-900">{totalRepetitions}</p>
                </div>
                <div className="rounded-3xl bg-cyan-50 p-4">
                  <p className="text-sm text-cyan-600">Current Repetition</p>
                  <p className="text-3xl font-semibold text-gray-900">{currentRepetition}</p>
                </div>
                <div className="rounded-3xl bg-emerald-50 p-4">
                  <p className="text-sm text-emerald-600">Target Word</p>
                  <p className="text-2xl font-semibold text-gray-900">{target?.wordEnglish}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-2xl border border-gray-200">
              <p className="text-sm text-gray-500 mb-4">Need a hint?</p>
              <div className="space-y-3 text-gray-700">
                <p>• Listen carefully to the sound.</p>
                <p>• All cards are from the same category.</p>
                <p>• One card is correct, two are distractors.</p>
              </div>
            </div>

            <button
              onClick={playSound}
              className="w-full rounded-full border border-gray-300 bg-white px-6 py-4 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
            >
              Replay Sound
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
