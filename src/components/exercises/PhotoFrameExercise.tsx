import { useState, useEffect, useRef, useCallback } from 'react';
import type { VocabularyDto, WordAttemptData, RepetitionData } from '../../services/api/patient-exercises.api';
import { Volume2, ChevronLeft, ChevronRight, CheckCircle, Mic, MicOff } from 'lucide-react';

interface PhotoFrameExerciseProps {
  vocabulary: VocabularyDto[];
  currentRepetition: number;
  totalRepetitions: number;
  onRepetitionComplete: (sessionData: string) => Promise<void>;
  onExerciseComplete: (score: number, sessionData: string) => Promise<void>;
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

export function PhotoFrameExercise({
  vocabulary,
  currentRepetition,
  totalRepetitions,
  onRepetitionComplete,
  onExerciseComplete,
  isCompleted = false,
  onPracticeAgain,
  allRepetitionData = [],
}: PhotoFrameExerciseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedWords, setConfirmedWords] = useState<Set<number>>(new Set());
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecordingSupport, setHasRecordingSupport] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wordStartTimeRef = useRef<number>(Date.now());
  const repStartTimeRef = useRef<number>(Date.now());
  const wordDataRef = useRef<Map<number, WordAttemptData>>(new Map());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const currentWord = vocabulary[currentIndex];
  const progress = vocabulary.length > 0 ? ((currentIndex + 1) / vocabulary.length) * 100 : 0;
  const isLastWord = currentIndex === vocabulary.length - 1;

  // Check microphone support
  useEffect(() => {
    setHasRecordingSupport(!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
  }, []);

  // Init analytics per repetition
  useEffect(() => {
    const map = new Map<number, WordAttemptData>();
    vocabulary.forEach(w => map.set(w.id, {
      wordId: w.id,
      wordEnglish: w.wordEnglish,
      wordArabic: w.wordArabic,
      attempts: 0,
      audioPlays: 0,
      firstTryCorrect: true,
      timeSpentSeconds: 0,
    }));
    wordDataRef.current = map;
    repStartTimeRef.current = Date.now();
    wordStartTimeRef.current = Date.now();
    setCurrentIndex(0);
    setConfirmedWords(new Set());
  }, [vocabulary, currentRepetition]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  const playSound = useCallback((word?: VocabularyDto) => {
    const target = word ?? currentWord;
    const url = getAssetUrl(target?.soundUrl);
    if (!url) return;
    stopAudio();

    // Track audio play
    if (target) {
      const d = wordDataRef.current.get(target.id);
      if (d) { d.audioPlays++; wordDataRef.current.set(target.id, d); }
    }

    const audio = new Audio(url);    // ← Bug fix: was missing this line in original
    audioRef.current = audio;
    audio.preload = 'auto';
    audio.load();
    setIsPlaying(true);

    const clear = () => { if (audioRef.current === audio) { audioRef.current = null; setIsPlaying(false); } };
    audio.addEventListener('ended', clear);
    audio.addEventListener('error', clear);
    audio.play().catch(() => { clear(); });
  }, [currentWord, stopAudio]);

  // Auto-play when word changes
  useEffect(() => {
    if (!currentWord || isCompleted) return;
    wordStartTimeRef.current = Date.now();
    const timer = setTimeout(() => playSound(currentWord), 300);
    return () => clearTimeout(timer);
  }, [currentIndex, currentWord?.id]);

  const recordTimeForWord = () => {
    if (!currentWord) return;
    const d = wordDataRef.current.get(currentWord.id);
    if (d) {
      d.timeSpentSeconds = Math.round((Date.now() - wordStartTimeRef.current) / 1000);
      wordDataRef.current.set(currentWord.id, d);
    }
  };

  const handleConfirm = () => {
    if (!currentWord) return;
    recordTimeForWord();
    setConfirmedWords(prev => new Set([...prev, currentWord.id]));
    // Track as practiced
    const d = wordDataRef.current.get(currentWord.id);
    if (d) { d.attempts = 1; wordDataRef.current.set(currentWord.id, d); }
  };

  const handleNext = () => {
    recordTimeForWord();
    if (currentIndex < vocabulary.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    recordTimeForWord();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const buildRepetitionData = (): RepetitionData => {
    const words = Array.from(wordDataRef.current.values());
    const practiced = words.filter(w => confirmedWords.has(w.wordId)).length;
    const accuracy = vocabulary.length > 0 ? Math.round((practiced / vocabulary.length) * 100) : 100;
    return {
      repetitionNumber: currentRepetition,
      completedAt: new Date().toISOString(),
      words,
      accuracyPercent: accuracy,
      durationSeconds: Math.round((Date.now() - repStartTimeRef.current) / 1000),
    };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    recordTimeForWord();
    try {
      const repData = buildRepetitionData();
      const allData = [...allRepetitionData, repData];
      const overallAccuracy = allData.length > 0
        ? Math.round(allData.reduce((s, r) => s + r.accuracyPercent, 0) / allData.length)
        : 100;
      const sessionJson = JSON.stringify({ exerciseType: 'photo_frame', repetitions: allData, overallAccuracyPercent: overallAccuracy });

      if (currentRepetition === totalRepetitions) {
        await onExerciseComplete(overallAccuracy, sessionJson);
      } else {
        await onRepetitionComplete(sessionJson);
      }
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Completion screen
  if (isCompleted) {
    const allData = allRepetitionData;
    const overallAccuracy = allData.length > 0
      ? Math.round(allData.reduce((s, r) => s + r.accuracyPercent, 0) / allData.length)
      : 100;
    const totalDuration = allData.reduce((s, r) => s + r.durationSeconds, 0);

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center">
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-2xl shadow-emerald-500/30 mb-6">
            <span className="text-5xl">✨</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Great Practice!</h1>
          <p className="text-emerald-300 mb-8">You've reviewed all {vocabulary.length} words</p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/10 rounded-2xl p-4">
              <div className="text-3xl font-bold text-white">{vocabulary.length}</div>
              <div className="text-emerald-300 text-xs mt-1">Words</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4">
              <div className="text-3xl font-bold text-white">{totalRepetitions}</div>
              <div className="text-emerald-300 text-xs mt-1">Rounds</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4">
              <div className="text-3xl font-bold text-white">{Math.round(totalDuration / 60)}m</div>
              <div className="text-emerald-300 text-xs mt-1">Duration</div>
            </div>
          </div>

          {allData.length > 0 && (
            <div className="bg-white/5 rounded-2xl p-4 mb-6 text-left">
              <p className="text-emerald-300 text-sm mb-3">Round breakdown:</p>
              <div className="space-y-2">
                {allData.map(r => (
                  <div key={r.repetitionNumber} className="flex items-center gap-3">
                    <span className="text-white/60 text-sm w-16">Round {r.repetitionNumber}</span>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full" style={{ width: `${r.accuracyPercent}%` }} />
                    </div>
                    <span className="text-white text-sm w-16 text-right">{r.durationSeconds}s</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {onPracticeAgain && (
            <button
              onClick={onPracticeAgain}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg hover:opacity-90 transition-all"
            >
              Back to Plans
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 p-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between pt-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Pronounce & Learn</h2>
            <p className="text-emerald-300 text-sm">Round {currentRepetition} of {totalRepetitions}</p>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
            <div className="text-white font-bold">{currentIndex + 1}/{vocabulary.length}</div>
            <div className="text-emerald-400 text-xs">words</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-white/10 rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Word dots navigation */}
        <div className="flex justify-center gap-1.5 mb-6 flex-wrap">
          {vocabulary.map((w, i) => (
            <button
              key={w.id}
              onClick={() => { recordTimeForWord(); setCurrentIndex(i); }}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentIndex
                  ? 'bg-emerald-400 scale-125'
                  : confirmedWords.has(w.id)
                  ? 'bg-emerald-600'
                  : 'bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        {/* Main card */}
        {currentWord && (
          <div className="bg-white/10 backdrop-blur rounded-3xl overflow-hidden border border-white/20 shadow-2xl mb-6">
            {/* Image */}
            <div className="relative bg-black/20 aspect-[4/3] overflow-hidden">
              {currentWord.imageUrl ? (
                <img
                  src={getAssetUrl(currentWord.imageUrl)}
                  alt={currentWord.wordEnglish}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl">🎯</span>
                </div>
              )}

              {/* Confirmed badge */}
              {confirmedWords.has(currentWord.id) && (
                <div className="absolute top-3 right-3 bg-emerald-500 rounded-full p-1.5 shadow-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            {/* Word info */}
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <p className="text-3xl font-bold text-white mb-1">{currentWord.wordEnglish}</p>
                  <p className="text-xl text-emerald-200" dir="rtl">{currentWord.wordArabic}</p>
                  {currentWord.category && (
                    <span className="inline-block mt-2 bg-emerald-500/20 text-emerald-300 rounded-full px-3 py-0.5 text-xs">
                      {currentWord.category}
                    </span>
                  )}
                </div>

                {/* Play button */}
                <button
                  onClick={() => playSound()}
                  disabled={isPlaying}
                  className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
                    isPlaying
                      ? 'bg-emerald-500/50 scale-95'
                      : 'bg-emerald-500 hover:bg-emerald-400 hover:scale-105'
                  }`}
                >
                  <Volume2 className={`w-6 h-6 text-white ${isPlaying ? 'animate-pulse' : ''}`} />
                </button>
              </div>

              {/* Instruction */}
              <div className="bg-white/5 rounded-xl p-3 text-center mb-4">
                <p className="text-emerald-300 text-sm">
                  🎙️ Say this word out loud, then tap <strong>I said it</strong>
                </p>
              </div>

              {/* Confirm button */}
              <button
                onClick={handleConfirm}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                  confirmedWords.has(currentWord.id)
                    ? 'bg-emerald-500/30 text-emerald-300 cursor-default'
                    : 'bg-emerald-500 text-white hover:bg-emerald-400'
                }`}
              >
                {confirmedWords.has(currentWord.id) ? '✓ Practiced this word' : 'I said it! ✓'}
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-medium transition-all ${
              currentIndex > 0
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          {isLastWord ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : currentRepetition === totalRepetitions ? '🏁 Finish' : 'Next Round →'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress summary */}
        <div className="mt-4 text-center">
          <p className="text-emerald-400/60 text-xs">
            {confirmedWords.size} of {vocabulary.length} words practiced this round
          </p>
        </div>
      </div>
    </div>
  );
}
