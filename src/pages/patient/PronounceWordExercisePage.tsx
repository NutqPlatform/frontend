import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  getPlanExercises,
  getExerciseVocabulary,
  startExercise as apiStartExercise,
  completeExercise as apiCompleteExercise,
  completeRepetition as apiCompleteRepetition,
  getPatientProgress,
  deriveExerciseState,
  type VocabularyDto,
  type ExerciseState,
  type ExerciseProgressDto,
  type PlanExerciseDto,
  type RepetitionData,
} from '../../services/api/patient-exercises.api';
import { ExerciseStateBadge, ExerciseActions, PhotoFrameExercise, CardMatchExercise } from '../../components/exercises';
import { ArrowLeft, BookOpen, Layers, Clock, BarChart2, Zap } from 'lucide-react';

export function PronounceWordExercisePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { planId, planExerciseId } = useParams<{ planId: string; planExerciseId: string }>();

  const [vocabulary, setVocabulary] = useState<VocabularyDto[]>([]);
  const [planExercise, setPlanExercise] = useState<PlanExerciseDto | null>(null);
  const [exerciseState, setExerciseState] = useState<ExerciseState>('not_started');
  const [currentProgress, setCurrentProgress] = useState<ExerciseProgressDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isExerciseCompleted, setIsExerciseCompleted] = useState(false);

  // Accumulate repetition data across reps for final session report
  const allRepetitionDataRef = useRef<RepetitionData[]>([]);

  const isCardMatch =
    planExercise?.exercise?.category?.toLowerCase() === 'tools' ||
    planExercise?.exercise?.name?.toLowerCase().includes('match');

  const planIdNum = parseInt(planId ?? '0', 10);
  const planExerciseIdNum = parseInt(planExerciseId ?? '0', 10);

  const loadData = useCallback(async () => {
    if (!user?.id || !planIdNum || !planExerciseIdNum) return;
    if (user.role !== 'patient') { navigate('/dashboard'); return; }
    setIsLoading(true);
    setError(null);
    try {
      const [vocabList, progressList, planExercises] = await Promise.all([
        getExerciseVocabulary(user.id, planExerciseIdNum),
        getPatientProgress(user.id),
        getPlanExercises(user.id, planIdNum),
      ]);
      const selectedExercise = planExercises.find(e => e.id === planExerciseIdNum) || null;
      if (!selectedExercise) throw new Error('Exercise not found in this therapy plan.');
      setVocabulary(vocabList);
      setPlanExercise(selectedExercise);
      setExerciseState(deriveExerciseState(progressList, planExerciseIdNum));
      const progress = progressList.find(p => p.planExerciseId === planExerciseIdNum);
      setCurrentProgress(progress ?? null);
    } catch (err: any) {
      setError(err?.message ? String(err.message) : 'Failed to load exercise. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.role, planExerciseIdNum, planIdNum, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleStart = async () => {
    if (!user?.id || !planExerciseIdNum) return;
    setIsStarting(true);
    setError(null);
    allRepetitionDataRef.current = [];
    try {
      await apiStartExercise(user.id, planExerciseIdNum);
      setExerciseState('started');
      await loadData();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to start exercise';
      setError(msg);
    } finally {
      setIsStarting(false);
    }
  };

  const handleCompleteRepetition = async (sessionData: string) => {
    if (!user?.id || !planExerciseIdNum) return;
    try {
      // Parse and accumulate rep data
      const parsed = JSON.parse(sessionData);
      if (parsed.repetitions?.length > 0) {
        allRepetitionDataRef.current = parsed.repetitions;
      }
      await apiCompleteRepetition(user.id, planExerciseIdNum, { sessionData });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete repetition');
      throw err;
    }
  };

  const handleComplete = async (score?: number, sessionData?: string) => {
    if (!user?.id || !planExerciseIdNum) return;
    try {
      await apiCompleteExercise(user.id, planExerciseIdNum, { score, sessionData });
      setIsExerciseCompleted(true);
      setExerciseState('completed');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete exercise');
    }
  };

  const handlePracticeAgain = () => {
    allRepetitionDataRef.current = [];
    navigate('/patient/plans');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-indigo-300">Loading exercise...</p>
        </div>
      </div>
    );
  }

  // Show exercise when running
  if ((exerciseState === 'started' || isExerciseCompleted) && currentProgress && vocabulary.length > 0) {
    const isCompleted = isExerciseCompleted || exerciseState === 'completed';

    return isCardMatch ? (
      <CardMatchExercise
        vocabulary={vocabulary}
        currentRepetition={currentProgress.currentRepetition}
        totalRepetitions={currentProgress.totalRepetitions}
        onRepetitionComplete={handleCompleteRepetition}
        onExerciseComplete={handleComplete}
        isCompleted={isCompleted}
        onPracticeAgain={handlePracticeAgain}
        allRepetitionData={allRepetitionDataRef.current}
      />
    ) : (
      <PhotoFrameExercise
        vocabulary={vocabulary}
        currentRepetition={currentProgress.currentRepetition}
        totalRepetitions={currentProgress.totalRepetitions}
        onRepetitionComplete={handleCompleteRepetition}
        onExerciseComplete={handleComplete}
        isCompleted={isCompleted}
        onPracticeAgain={handlePracticeAgain}
        allRepetitionData={allRepetitionDataRef.current}
      />
    );
  }

  // Start screen
  return (
    <div className={`min-h-screen p-4 ${isCardMatch
      ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900'
      : 'bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900'
    }`}>
      <div className="max-w-xl mx-auto pt-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/patient/plans')}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to plans
        </button>

        {/* Exercise type badge */}
        <div className="mb-6">
          <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium ${
            isCardMatch
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            {isCardMatch ? <Layers className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
            {isCardMatch ? 'Card Match Exercise' : 'Pronunciation Exercise'}
          </span>
        </div>

        <h1 className="text-4xl font-bold text-white mb-3">
          {planExercise?.exercise?.name ?? 'Exercise'}
        </h1>
        <p className="text-white/60 mb-8">
          {isCardMatch
            ? 'Listen to the word sound and pick the correct card. This tests your word recognition and listening skills.'
            : 'See each word with its image and pronunciation. Say the word out loud to practice speaking.'}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white/10 rounded-2xl p-4 text-center">
            <div className="text-white font-bold text-xl">{vocabulary.length}</div>
            <div className="text-white/50 text-xs mt-0.5">Words</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 text-center">
            <div className="text-white font-bold text-xl">{planExercise?.repetition ?? 1}x</div>
            <div className="text-white/50 text-xs mt-0.5">Rounds</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 text-center">
            <div className="text-white font-bold text-xl">{planExercise?.durationMinutes ?? '?'}</div>
            <div className="text-white/50 text-xs mt-0.5">Minutes</div>
          </div>
        </div>

        {/* Status */}
        <div className="mb-6">
          <ExerciseStateBadge state={exerciseState} />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
            <p className="text-red-300 text-sm">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 text-xs mt-1 hover:text-red-300">Dismiss</button>
          </div>
        )}

        {/* Word preview */}
        {vocabulary.length > 0 && (
          <div className="mb-6">
            <p className="text-white/50 text-sm mb-3">Words in this exercise:</p>
            <div className="flex flex-wrap gap-2">
              {vocabulary.slice(0, 6).map(w => (
                <span key={w.id} className="bg-white/10 text-white/80 rounded-full px-3 py-1 text-sm">
                  {w.wordEnglish}
                </span>
              ))}
              {vocabulary.length > 6 && (
                <span className="bg-white/5 text-white/40 rounded-full px-3 py-1 text-sm">
                  +{vocabulary.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* What's tracked */}
        <div className="bg-white/5 rounded-2xl p-4 mb-8 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="w-4 h-4 text-white/60" />
            <span className="text-white/60 text-sm">Your progress is tracked</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-white/40">
            <div className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> Response accuracy</div>
            <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Time per word</div>
            <div className="flex items-center gap-1.5"><BarChart2 className="w-3 h-3" /> Audio plays needed</div>
            <div className="flex items-center gap-1.5"><Layers className="w-3 h-3" /> Per-word difficulty</div>
          </div>
        </div>

        {/* Start button */}
        <ExerciseActions
          state={exerciseState}
          onStart={handleStart}
          onComplete={() => handleComplete()}
          onPracticeAgain={handlePracticeAgain}
          isStarting={isStarting}
          isCompleting={false}
        />
      </div>
    </div>
  );
}
