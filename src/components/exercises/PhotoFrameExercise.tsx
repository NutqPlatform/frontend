import { useState, useEffect, useRef, useCallback } from 'react';
import type { VocabularyDto, WordAttemptData, RepetitionData, PatientExerciseSessionAnalyticsDto } from '../../services/api/patient-exercises.api';
import { Volume2, ChevronLeft, ChevronRight, CheckCircle, Mic } from 'lucide-react';
import { startSpeechRecognition, evaluatePronunciation, isSpeechRecognitionSupported } from '../../utils/speechRecognition';
import { ExerciseFeedbackSummary } from './ExerciseFeedbackSummary';
import {
  buildSessionPayload,
  computeOverallAccuracy,
  createEmptyWordAttempt,
  getExpectedWord,
  recordSpeechAttempt,
} from '../../utils/sessionAnalytics';

interface PhotoFrameExerciseProps {
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

export function PhotoFrameExercise({
  vocabulary,
  currentRepetition,
  totalRepetitions,
  sessionStartedAt,
  sessionAnalytics = null,
  analyticsLoading = false,
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
  const [speechFeedback, setSpeechFeedback] = useState<{ text: string; accuracy: number; isCorrect: boolean; feedback: string } | null>(null);
  const [showingFeedback, setShowingFeedback] = useState(false);
  const [speechSupported, setSpeechSupported] = useState<boolean | null>(null);
  const [microphoneMuted, setMicrophoneMuted] = useState(true);
  const [accuracyThreshold] = useState(0.7); // Configurable tolerance (70% by default)
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  const [wordPerformance, setWordPerformance] = useState<Map<number, { attempts: number; successful: boolean }>>(new Map());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wordStartTimeRef = useRef<number>(Date.now());
  const repStartTimeRef = useRef<number>(Date.now());
  const wordDataRef = useRef<Map<number, WordAttemptData>>(new Map());
  const recordingStartRef = useRef<number>(0);
  const sessionStartedAtRef = useRef<string>(sessionStartedAt ?? new Date().toISOString());

  const currentWord = vocabulary[currentIndex];
  const progress = vocabulary.length > 0 ? ((currentIndex + 1) / vocabulary.length) * 100 : 0;
  const isLastWord = currentIndex === vocabulary.length - 1;

  // Check microphone support
  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionSupported());
  }, []);

  useEffect(() => {
    if (sessionStartedAt) sessionStartedAtRef.current = sessionStartedAt;
  }, [sessionStartedAt]);

  // Init analytics per repetition
  useEffect(() => {
    const map = new Map<number, WordAttemptData>();
    vocabulary.forEach(w => map.set(w.id, createEmptyWordAttempt(w)));
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

  const handleSpeechRecognition = async () => {
    if (!currentWord || isRecording) return;
    
    // Check if speech recognition is supported
    if (speechSupported === false) {
      setSpeechFeedback({
        text: '',
        accuracy: 0,
        isCorrect: false,
        feedback: '❌ Speech Recognition API not supported in this browser. Please use a modern browser like Chrome, Edge, or Safari.',
      });
      setShowingFeedback(true);
      return;
    }
    
    setIsRecording(true);
    setSpeechFeedback(null);
    recordingStartRef.current = Date.now();
    
    try {
      const result = await startSpeechRecognition('ar-SA');
      const feedback = evaluatePronunciation(
        result.transcript,
        currentWord.wordEnglish,
        currentWord.wordArabic,
        true,
        accuracyThreshold
      );
      const audioDurationSeconds = (Date.now() - recordingStartRef.current) / 1000;
      const expectedWord = getExpectedWord(currentWord.wordEnglish, currentWord.wordArabic);
      
      setSpeechFeedback({
        text: feedback.recognized,
        accuracy: feedback.accuracy,
        isCorrect: feedback.isCorrect,
        feedback: feedback.feedback,
      });
      setShowingFeedback(true);
      
      const d = wordDataRef.current.get(currentWord.id);
      if (d) {
        recordSpeechAttempt(d, {
          expectedWord,
          recognizedWord: feedback.recognized,
          similarityScore: feedback.accuracy,
          isCorrect: feedback.isCorrect,
          audioDurationSeconds,
        });
        wordDataRef.current.set(currentWord.id, d);
      }

      // Track word performance for highlighting
      const perf = wordPerformance.get(currentWord.id) || { attempts: 0, successful: false };
      perf.attempts++;
      if (feedback.isCorrect) {
        perf.successful = true;
      }
      const newPerformance = new Map(wordPerformance);
      newPerformance.set(currentWord.id, perf);
      setWordPerformance(newPerformance);
      
      // Auto-confirm and advance if correct
      if (feedback.isCorrect) {
        handleConfirm();
        setTimeout(() => {
          // Move to next word automatically
          if (!isLastWord) {
            handleNext();
          } else {
            // For the last word, show feedback briefly then show completion
            setShowingFeedback(true);
          }
          // Mute microphone after successful pronunciation
          setMicrophoneMuted(true);
          setShowingFeedback(false);
        }, 2000);
      }
    } catch (err) {
      const audioDurationSeconds = (Date.now() - recordingStartRef.current) / 1000;
      const expectedWord = getExpectedWord(currentWord.wordEnglish, currentWord.wordArabic);
      const d = wordDataRef.current.get(currentWord.id);
      if (d) {
        recordSpeechAttempt(d, {
          expectedWord,
          recognizedWord: '',
          similarityScore: 0,
          isCorrect: false,
          audioDurationSeconds,
        });
        wordDataRef.current.set(currentWord.id, d);
      }

      setSpeechFeedback({
        text: '',
        accuracy: 0,
        isCorrect: false,
        feedback: `❌ ${err instanceof Error ? err.message : 'فشل التعرف على الكلام (Speech recognition failed)'}`,
      });
      setShowingFeedback(true);
    } finally {
      setIsRecording(false);
    }
  };

  const handleConfirm = () => {
    if (!currentWord) return;
    recordTimeForWord();
    setConfirmedWords(prev => new Set([...prev, currentWord.id]));
    const d = wordDataRef.current.get(currentWord.id);
    if (d && (!d.speechAttempts || d.speechAttempts.length === 0)) {
      const expectedWord = getExpectedWord(currentWord.wordEnglish, currentWord.wordArabic);
      recordSpeechAttempt(d, {
        expectedWord,
        recognizedWord: expectedWord,
        similarityScore: 100,
        isCorrect: true,
        audioDurationSeconds: Math.max(0, (Date.now() - wordStartTimeRef.current) / 1000),
      });
      wordDataRef.current.set(currentWord.id, d);
    }
  };

  const handleNext = () => {
    recordTimeForWord();
    if (currentIndex < vocabulary.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setMicrophoneMuted(true);
      setShowingFeedback(false);
    }
  };

  const handlePrev = () => {
    recordTimeForWord();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setMicrophoneMuted(true);
      setShowingFeedback(false);
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
      const overallAccuracy = computeOverallAccuracy(allData);
      const sessionJson = buildSessionPayload('photo_frame', allData, sessionStartedAtRef.current);

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

  // Completion screen - show detailed feedback summary
  if (isCompleted) {
    const totalDuration = sessionAnalytics?.totalDurationSeconds ?? 0;
    const overallAccuracy = sessionAnalytics
      ? Math.round(sessionAnalytics.accuracyPercent)
      : 100;

    if (showDetailedFeedback && sessionAnalytics) {
      return (
        <ExerciseFeedbackSummary
          sessionAnalytics={sessionAnalytics}
          onClose={onPracticeAgain}
        />
      );
    }

    if (analyticsLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 flex items-center justify-center p-6">
          <div className="text-center text-white">
            <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-emerald-300">Loading session analytics...</p>
          </div>
        </div>
      );
    }

    // Show quick celebration screen first with option to view detailed feedback
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
              <div className="text-3xl font-bold text-white">{sessionAnalytics?.wordsCompleted ?? vocabulary.length}</div>
              <div className="text-emerald-300 text-xs mt-1">Words</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4">
              <div className="text-3xl font-bold text-white">{Math.round(sessionAnalytics?.firstAttemptSuccessRate ?? 0)}%</div>
              <div className="text-emerald-300 text-xs mt-1">First Try</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4">
              <div className="text-3xl font-bold text-white">{overallAccuracy}%</div>
              <div className="text-emerald-300 text-xs mt-1">Accuracy</div>
            </div>
          </div>

          {sessionAnalytics && (
            <div className="bg-white/5 rounded-2xl p-4 mb-6 text-left">
              <div className="flex items-center justify-between mb-3">
                <p className="text-emerald-300 text-sm">Session stats</p>
                <span className="text-xs text-emerald-400 font-semibold">
                  Total: {Math.floor(totalDuration / 60)}m {totalDuration % 60}s · Avg similarity {Math.round(sessionAnalytics.averageSimilarityScore)}%
                </span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {sessionAnalytics.words.map((w) => (
                  <div key={w.vocabularyId ?? w.expectedWord} className="flex items-center gap-3">
                    <span className="text-white/60 text-sm w-20 truncate">{w.wordEnglish}</span>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${w.succeeded ? 'bg-emerald-400' : 'bg-amber-400'}`}
                        style={{ width: `${w.bestSimilarityScore}%` }}
                      />
                    </div>
                    <span className="text-white/80 text-xs w-16 text-right">{w.totalAttempts} try · {Math.round(w.bestSimilarityScore)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowDetailedFeedback(true)}
              disabled={!sessionAnalytics}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-lg hover:opacity-90 transition-all disabled:opacity-40"
            >
              📊 View Detailed Feedback
            </button>
            {onPracticeAgain && (
              <button
                onClick={onPracticeAgain}
                className="w-full py-4 rounded-2xl bg-white/10 text-white font-bold text-lg hover:bg-white/20 transition-all"
              >
                Back to Plans
              </button>
            )}
          </div>
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
          {vocabulary.map((w, i) => {
            const perf = wordPerformance.get(w.id);
            const isProblematic = perf && perf.attempts > 1 && !perf.successful;
            
            return (
              <button
                key={w.id}
                onClick={() => { recordTimeForWord(); setCurrentIndex(i); }}
                title={isProblematic ? '⚠️ Needs practice' : confirmedWords.has(w.id) ? '✓ Done' : 'Not started'}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === currentIndex
                    ? 'bg-emerald-400 scale-125'
                    : isProblematic
                    ? 'bg-red-500/70 scale-110 shadow-lg shadow-red-500/50'
                    : confirmedWords.has(w.id)
                    ? 'bg-emerald-600'
                    : 'bg-white/20 hover:bg-white/40'
                }`}
              />
            );
          })}
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
                <p className="text-emerald-300 text-sm" dir="rtl">
                  🎙️ اضغط على الميكروفون وقل هذه الكلمة
                </p>
              </div>

              {/* Browser support warning */}
              {speechSupported === false && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center mb-4">
                  <p className="text-amber-300 text-sm">
                    ⚠️ متصفحك لا يدعم التعرف على الكلام. يرجى استخدام متصفح حديث مثل Chrome أو Edge أو Safari.
                  </p>
                  <p className="text-amber-400 text-xs mt-1">
                    Browser doesn't support speech recognition. Please use a modern browser.
                  </p>
                </div>
              )}

              {/* Speech feedback */}
              {showingFeedback && speechFeedback && (
                <div className={`mb-4 p-4 rounded-xl border-2 ${
                  speechFeedback.isCorrect
                    ? 'bg-emerald-500/10 border-emerald-500'
                    : 'bg-amber-500/10 border-amber-500'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${
                        speechFeedback.isCorrect ? 'text-emerald-300' : 'text-amber-300'
                      }`}>
                        You said: "{speechFeedback.text}"
                      </p>
                      <p className="text-xs text-gray-300 mt-1">{speechFeedback.feedback}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              speechFeedback.isCorrect
                                ? 'bg-emerald-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${speechFeedback.accuracy}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-300 w-8 text-right">
                          {speechFeedback.accuracy}%
                        </span>
                      </div>
                    </div>
                    <div className={`text-2xl flex-shrink-0 ${
                      speechFeedback.isCorrect ? '' : ''
                    }`}>
                      {speechFeedback.isCorrect ? '✅' : '⚠️'}
                    </div>
                  </div>
                </div>
              )}

              {/* Microphone button */}
              <button
                onClick={() => {
                  if (microphoneMuted) {
                    setMicrophoneMuted(false);
                  } else {
                    handleSpeechRecognition();
                  }
                }}
                disabled={isRecording || confirmedWords.has(currentWord.id) || speechSupported === false}
                className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all mb-3 ${
                  confirmedWords.has(currentWord.id)
                    ? 'bg-emerald-500/30 text-emerald-300 cursor-default'
                    : isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : speechSupported === false
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : microphoneMuted
                    ? 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                    : 'bg-blue-500 text-white hover:bg-blue-400'
                }`}
              >
                {isRecording ? (
                  <>
                    <Mic className="w-5 h-5 animate-bounce" />
                    جاري الاستماع...
                  </>
                ) : confirmedWords.has(currentWord.id) ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    ✓ تم تأكيد الكلمة
                  </>
                ) : speechSupported === false ? (
                  <>
                    <Mic className="w-5 h-5 opacity-50" />
                    غير مدعوم في هذا المتصفح
                  </>
                ) : microphoneMuted ? (
                  <>
                    <Mic className="w-5 h-5 line-through" />
                    اضغط لتفعيل الميكروفون
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    اضغط للتكلم
                  </>
                )}
              </button>

              {/* Manual confirm button as fallback */}
              <button
                onClick={handleConfirm}
                disabled={confirmedWords.has(currentWord.id)}
                className={`w-full py-2 rounded-lg text-xs font-medium transition-all ${
                  confirmedWords.has(currentWord.id)
                    ? 'bg-gray-500/20 text-gray-400 cursor-default'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                Skip speech check ✓
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
        <div className="mt-4 space-y-2">
          <p className="text-emerald-400/60 text-xs text-center">
            {confirmedWords.size} of {vocabulary.length} words practiced this round
          </p>
          {Array.from(wordPerformance.entries()).some(([_, p]) => p.attempts > 1 && !p.successful) && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center">
              <p className="text-red-300 text-xs">
                ⚠️ {Array.from(wordPerformance.entries()).filter(([_, p]) => p.attempts > 1 && !p.successful).length} word(s) need more practice
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}