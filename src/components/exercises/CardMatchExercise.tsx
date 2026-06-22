import { useEffect, useRef, useState, useCallback } from 'react';
import type { VocabularyDto, WordAttemptData, RepetitionData, PatientExerciseSessionAnalyticsDto } from '../../services/api/patient-exercises.api';
import { Volume2, CheckCircle, XCircle } from 'lucide-react';
import {
  buildSessionPayload,
  computeOverallAccuracy,
  createEmptyWordAttempt,
  getExpectedWord,
  recordSpeechAttempt,
} from '../../utils/sessionAnalytics';

interface CardMatchExerciseProps {
  vocabulary: VocabularyDto[];
  currentRepetition: number;
  totalRepetitions: number;
  sessionStartedAt?: string;
  sessionAnalytics?: PatientExerciseSessionAnalyticsDto | null;
  analyticsLoading?: boolean;
  onRepetitionComplete: (sessionData?: string) => Promise<void>;
  onExerciseComplete: (score?: number, sessionData?: string) => Promise<void>;
  isCompleted?: boolean;
  onPracticeAgain?: () => void;
  allRepetitionData?: RepetitionData[];
}

const BASE_URL = 'http://localhost:5246';
const getAssetUrl = (url?: string) => {
  if (!url) return undefined;
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${BASE_URL}${encodeURI(path)}`;
};

function playTone(freq: number, type: OscillatorType, duration: number, gain: number, onEnd?: () => void) {
  try {
    const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) { onEnd?.(); return; }
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + duration);
    osc.onended = () => { ctx.close(); onEnd?.(); };
  } catch { onEnd?.(); }
}

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

export function CardMatchExercise({
  vocabulary,
  currentRepetition,
  totalRepetitions,
  sessionStartedAt,
  onRepetitionComplete,
  onExerciseComplete,
  isCompleted = false,
  onPracticeAgain,
  allRepetitionData = [],
}: CardMatchExerciseProps) {
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [targetSequence, setTargetSequence] = useState<VocabularyDto[]>([]);
  const [roundCards, setRoundCards] = useState<VocabularyDto[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wordStartTimeRef = useRef<number>(Date.now());
  const repStartTimeRef = useRef<number>(Date.now());

  const wordDataRef = useRef<Map<number, WordAttemptData>>(new Map());
  const sessionStartedAtRef = useRef<string>(sessionStartedAt ?? new Date().toISOString());

  const target = targetSequence[sequenceIndex] ?? null;

  useEffect(() => {
    if (sessionStartedAt) sessionStartedAtRef.current = sessionStartedAt;
  }, [sessionStartedAt]);

  // Initialize rep analytics
  const initWordData = useCallback((words: VocabularyDto[]) => {
    const map = new Map<number, WordAttemptData>();
    words.forEach(w => map.set(w.id, createEmptyWordAttempt(w)));
    wordDataRef.current = map;
    repStartTimeRef.current = Date.now();
    wordStartTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (isCompleted || vocabulary.length === 0) return;
    const seq = shuffle([...vocabulary]);
    setTargetSequence(seq);
    setSequenceIndex(0);
    initWordData(vocabulary);
  }, [vocabulary, currentRepetition, isCompleted, initWordData]);

  useEffect(() => {
    if (!target) return;
    const distractors = shuffle(vocabulary.filter(v => v.id !== target.id)).slice(0, 2);
    setRoundCards(shuffle([target, ...distractors]));
    setSelectedCardId(null);
    setFeedbackState('idle');
    wordStartTimeRef.current = Date.now();
    stopAudio();
    playSound(target);
  }, [target]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
      setIsPlaying(false);
    }
  };

  const playSound = (word?: VocabularyDto | null) => {
    const t = word ?? target;
    const url = getAssetUrl(t?.soundUrl);
    if (!url) return;
    stopAudio();
    // Track audio play
    if (t) {
      const d = wordDataRef.current.get(t.id);
      if (d) { d.audioPlays++; wordDataRef.current.set(t.id, d); }
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.preload = 'auto';
    setIsPlaying(true);
    const clear = () => { if (audioRef.current === audio) { audioRef.current = null; setIsPlaying(false); } };
    audio.addEventListener('ended', clear);
    audio.addEventListener('error', clear);
    audio.play().catch(clear);
  };

  const buildRepetitionData = (): RepetitionData => {
    const words = Array.from(wordDataRef.current.values());
    const correct = words.filter(w => w.firstTryCorrect).length;
    const accuracy = words.length > 0 ? Math.round((correct / words.length) * 100) : 0;
    const duration = Math.round((Date.now() - repStartTimeRef.current) / 1000);
    return {
      repetitionNumber: currentRepetition,
      completedAt: new Date().toISOString(),
      words,
      accuracyPercent: accuracy,
      durationSeconds: duration,
    };
  };

  const advanceRound = async () => {
    if (isAdvancing) return;
    setIsAdvancing(true);

    // Record time spent on this word
    const timeSpent = Math.round((Date.now() - wordStartTimeRef.current) / 1000);
    if (target) {
      const d = wordDataRef.current.get(target.id);
      if (d) { d.timeSpentSeconds = timeSpent; wordDataRef.current.set(target.id, d); }
    }

    try {
      const isLastWord = sequenceIndex === targetSequence.length - 1;
      if (isLastWord) {
        const repData = buildRepetitionData();
        const allData = [...allRepetitionData, repData];
        const overallAccuracy = computeOverallAccuracy(allData);
        const sessionJson = buildSessionPayload('card_match', allData, sessionStartedAtRef.current);

        if (currentRepetition < totalRepetitions) {
          await onRepetitionComplete(sessionJson);
        } else {
          await onExerciseComplete(overallAccuracy, sessionJson);
        }
      } else {
        setSequenceIndex(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to advance:', err);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleChoice = (choice: VocabularyDto) => {
    if (feedbackState === 'correct' || isAdvancing || !target) return;

    const isCorrect = choice.id === target.id;
    const expectedWord = getExpectedWord(target.wordEnglish, target.wordArabic);
    const recognizedWord = getExpectedWord(choice.wordEnglish, choice.wordArabic);
    const attemptDuration = Math.max(0, (Date.now() - wordStartTimeRef.current) / 1000);

    const d = wordDataRef.current.get(target.id);
    if (d) {
      recordSpeechAttempt(d, {
        expectedWord,
        recognizedWord,
        similarityScore: isCorrect ? 100 : 0,
        isCorrect,
        audioDurationSeconds: attemptDuration,
      });
      wordDataRef.current.set(target.id, d);
    }

    setSelectedCardId(choice.id);

    if (isCorrect) {
      setFeedbackState('correct');
      playTone(880, 'triangle', 0.3, 0.15);
      setTimeout(advanceRound, 800);
    } else {
      setFeedbackState('wrong');
      playTone(220, 'square', 0.3, 0.15, () => {
        stopAudio();
        playSound();
      });
      setTimeout(() => {
        setSelectedCardId(null);
        setFeedbackState('idle');
      }, 800);
    }
  };

  // Completion screen
  if (isCompleted) {
    const allData = allRepetitionData;
    const overallAccuracy = allData.length > 0
      ? Math.round(allData.reduce((s, r) => s + r.accuracyPercent, 0) / allData.length)
      : 0;
    const hardWords = allData.flatMap(r => r.words.filter(w => !w.firstTryCorrect).map(w => w.wordEnglish));
    const uniqueHard = [...new Set(hardWords)];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          {/* Trophy */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-2xl shadow-amber-500/30 mb-4">
              <span className="text-5xl">🏆</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Session Complete!</h1>
            <p className="text-indigo-300">You matched all {vocabulary.length} cards across {totalRepetitions} repetitions</p>
          </div>

          {/* Score card */}
          <div className="bg-white/10 backdrop-blur rounded-3xl p-6 mb-6 border border-white/20">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-4xl font-bold text-white">{overallAccuracy}%</div>
                <div className="text-indigo-300 text-sm mt-1">Accuracy</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white">{totalRepetitions}</div>
                <div className="text-indigo-300 text-sm mt-1">Rounds</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white">{vocabulary.length}</div>
                <div className="text-indigo-300 text-sm mt-1">Words</div>
              </div>
            </div>
          </div>

          {/* Hard words */}
          {uniqueHard.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6">
              <p className="text-amber-300 text-sm font-medium mb-2">⚡ Words to practice more:</p>
              <div className="flex flex-wrap gap-2">
                {uniqueHard.map(w => (
                  <span key={w} className="bg-amber-500/20 text-amber-200 rounded-full px-3 py-1 text-sm">{w}</span>
                ))}
              </div>
            </div>
          )}

          {/* Per-rep breakdown */}
          {allData.length > 0 && (
            <div className="bg-white/5 rounded-2xl p-4 mb-6">
              <p className="text-indigo-300 text-sm mb-3">Round by round:</p>
              <div className="space-y-2">
                {allData.map(r => (
                  <div key={r.repetitionNumber} className="flex items-center gap-3">
                    <span className="text-white/60 text-sm w-16">Round {r.repetitionNumber}</span>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all"
                        style={{ width: `${r.accuracyPercent}%` }}
                      />
                    </div>
                    <span className="text-white text-sm w-12 text-right">{r.accuracyPercent}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {onPracticeAgain && (
            <button
              onClick={onPracticeAgain}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-lg hover:opacity-90 transition-all"
            >
              Back to Plans
            </button>
          )}
        </div>
      </div>
    );
  }

  const progress = targetSequence.length > 0 ? ((sequenceIndex + 1) / targetSequence.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Listen & Match</h2>
            <p className="text-indigo-300 text-sm">Round {currentRepetition} of {totalRepetitions}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-white font-bold">{sequenceIndex + 1}/{targetSequence.length}</div>
              <div className="text-indigo-400 text-xs">words</div>
            </div>
            {/* Accuracy indicator */}
            {wordDataRef.current.size > 0 && (() => {
              const words = Array.from(wordDataRef.current.values()).filter(w => w.attempts > 0);
              const acc = words.length > 0 ? Math.round(words.filter(w => w.firstTryCorrect).length / words.length * 100) : 100;
              return (
                <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
                  <div className="text-white font-bold text-sm">{acc}%</div>
                  <div className="text-indigo-400 text-xs">accuracy</div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-white/10 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Play button - big central element */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => playSound()}
            disabled={isPlaying}
            className={`relative flex flex-col items-center gap-3 group`}
          >
            <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
              isPlaying
                ? 'bg-gradient-to-br from-purple-500 to-indigo-600 scale-95'
                : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:scale-105 group-hover:shadow-indigo-500/40'
            }`}>
              <Volume2 className="w-10 h-10 text-white" />
              {isPlaying && (
                <div className="absolute inset-0 rounded-full border-4 border-indigo-400 animate-ping opacity-50" />
              )}
            </div>
            <span className="text-indigo-300 text-sm">{isPlaying ? 'Playing...' : 'Tap to hear the word'}</span>
          </button>
        </div>

        {/* Feedback banner */}
        <div className={`text-center mb-6 transition-all duration-300 ${feedbackState === 'idle' ? 'opacity-0' : 'opacity-100'}`}>
          {feedbackState === 'correct' && (
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 rounded-full px-6 py-2 border border-emerald-500/30">
              <CheckCircle className="w-4 h-4" /> Correct! Well done.
            </div>
          )}
          {feedbackState === 'wrong' && (
            <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-300 rounded-full px-6 py-2 border border-red-500/30">
              <XCircle className="w-4 h-4" /> Try again — listen carefully
            </div>
          )}
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          {roundCards.map((card) => {
            const isSelected = selectedCardId === card.id;
            const isCorrectSelected = isSelected && feedbackState === 'correct';
            const isWrongSelected = isSelected && feedbackState === 'wrong';

            return (
              <button
                key={card.id}
                onClick={() => handleChoice(card)}
                disabled={isAdvancing || feedbackState === 'correct'}
                className={`relative rounded-2xl overflow-hidden transition-all duration-200 ${
                  isCorrectSelected
                    ? 'ring-4 ring-emerald-400 scale-105'
                    : isWrongSelected
                    ? 'ring-4 ring-red-400 opacity-70'
                    : 'hover:scale-102 hover:ring-2 ring-white/20'
                } ${isAdvancing ? 'pointer-events-none' : ''}`}
              >
                {/* Image */}
                <div className="relative bg-white/5 aspect-square overflow-hidden">
                  {card.imageUrl ? (
                    <img
                      src={getAssetUrl(card.imageUrl)}
                      alt={card.wordEnglish}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🎯</div>
                  )}

                  {/* Overlay on selection */}
                  {isCorrectSelected && (
                    <div className="absolute inset-0 bg-emerald-500/40 flex items-center justify-center">
                      <CheckCircle className="w-12 h-12 text-white" />
                    </div>
                  )}
                  {isWrongSelected && (
                    <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center">
                      <XCircle className="w-12 h-12 text-white" />
                    </div>
                  )}
                </div>

                {/* Word label */}
                <div className="bg-white/10 backdrop-blur p-3 text-left">
                  <p className="text-white font-semibold text-sm leading-tight">{card.wordEnglish}</p>
                  <p className="text-indigo-300 text-xs" dir="rtl">{card.wordArabic}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom hint */}
        <p className="text-center text-indigo-400/60 text-sm mt-6">
          Listen carefully, then tap the card that matches the sound
        </p>
      </div>
    </div>
  );
}