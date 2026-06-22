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
  getExerciseSessionAnalytics,
  type VocabularyDto,
  type ExerciseState,
  type ExerciseProgressDto,
  type PlanExerciseDto,
  type RepetitionData,
  type PatientExerciseSessionAnalyticsDto,
} from '../../services/api/patient-exercises.api';
import {
  ExerciseStateBadge,
  ExerciseActions,
  PhotoFrameExercise,
  CardMatchExercise,
} from '../../components/exercises';
import { Target, Sparkles, Star, Heart } from 'lucide-react';

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
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastCompletedRepetition, setLastCompletedRepetition] = useState<number | null>(null);

  // Accumulate repetition data for analytics — stored in a ref so it
  // never causes re-renders and never gets reset by loadData()
  const allRepetitionDataRef = useRef<RepetitionData[]>([]);
  const [sessionAnalytics, setSessionAnalytics] = useState<PatientExerciseSessionAnalyticsDto | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const isCardMatchGame =
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
      const selectedExercise = planExercises.find((e) => e.id === planExerciseIdNum) || null;
      if (!selectedExercise) throw new Error('Exercise not found in this therapy plan.');
      setVocabulary(vocabList);
      setPlanExercise(selectedExercise);
      setExerciseState(deriveExerciseState(progressList, planExerciseIdNum));
      const progress = progressList.find((p) => p.planExerciseId === planExerciseIdNum);
      setCurrentProgress(progress ?? null);
    } catch (err: any) {
      setError(err?.message ? String(err.message) : 'Failed to load exercise. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.role, planExerciseIdNum, planIdNum, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  const loadSessionAnalytics = useCallback(async () => {
    if (!user?.id || !planExerciseIdNum) return;
    setAnalyticsLoading(true);
    try {
      const data = await getExerciseSessionAnalytics(user.id, planExerciseIdNum);
      setSessionAnalytics(data);
    } catch {
      setSessionAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [user?.id, planExerciseIdNum]);

  useEffect(() => {
    if ((showCelebration || exerciseState === 'completed') && user?.id && planExerciseIdNum) {
      loadSessionAnalytics();
    }
  }, [showCelebration, exerciseState, user?.id, planExerciseIdNum, loadSessionAnalytics]);

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
      setError(`Failed to start: ${msg}`);
    } finally {
      setIsStarting(false);
    }
  };

  // Called by exercise components when a repetition finishes.
  // sessionData is optional — old components that don't pass it still work.
  const handleCompleteRepetition = async (sessionData?: string) => {
    if (!user?.id || !planExerciseIdNum || !currentProgress) return;
    const completedRepetition = currentProgress.currentRepetition;

    // Accumulate rep data from the JSON if provided
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        if (parsed.repetitions?.length > 0) {
          allRepetitionDataRef.current = parsed.repetitions;
        }
      } catch { /* ignore parse errors */ }
    }

    try {
      await apiCompleteRepetition(user.id, planExerciseIdNum, sessionData ? { sessionData } : undefined);
      setLastCompletedRepetition(completedRepetition);
      // Update progress from server (next repetition number)
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete repetition');
      throw err;
    }
  };

  // Called by exercise components when the whole exercise finishes.
  // score and sessionData are optional for backwards compatibility.
  const handleComplete = async (score?: number, sessionData?: string) => {
    if (!user?.id || !planExerciseIdNum) return;
    setIsCompleting(true);
    setError(null);
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        if (parsed.repetitions?.length > 0) {
          allRepetitionDataRef.current = parsed.repetitions;
        }
      } catch { /* ignore */ }
    }
    try {
      await apiCompleteExercise(
        user.id,
        planExerciseIdNum,
        score !== undefined || sessionData ? { score, sessionData } : undefined
      );
      setExerciseState('completed');
      setShowCelebration(true);
      await loadData();
      await loadSessionAnalytics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete exercise');
    } finally {
      setIsCompleting(false);
    }
  };

  const handlePracticeAgain = () => {
    setShowCelebration(false);
    setLastCompletedRepetition(null);
    allRepetitionDataRef.current = [];
    navigate('/patient/plans');
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="mb-4 text-6xl">✨</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Exercise...</h2>
          <div className="w-48 h-3 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!planId || !planExerciseId || !user?.id) {
    return (
      <div className="rounded-2xl bg-gradient-to-r from-yellow-50 to-orange-50 p-8 text-center">
        <div className="text-4xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-yellow-800">Oops! Invalid exercise.</h2>
        <button onClick={() => navigate('/patient/plans')} className="mt-4 px-6 py-2 rounded-full bg-yellow-500 text-white font-bold">
          Go Back
        </button>
      </div>
    );
  }

  // ── Celebration / Completed ───────────────────────────────────────────────
  if (showCelebration || exerciseState === 'completed') {
    const celebrationRepetition = lastCompletedRepetition ?? currentProgress?.currentRepetition ?? 1;
    return isCardMatchGame ? (
      <CardMatchExercise
        vocabulary={vocabulary}
        currentRepetition={celebrationRepetition}
        totalRepetitions={currentProgress?.totalRepetitions || 1}
        sessionStartedAt={currentProgress?.startTime}
        sessionAnalytics={sessionAnalytics}
        analyticsLoading={analyticsLoading}
        onRepetitionComplete={handleCompleteRepetition}
        onExerciseComplete={handleComplete}
        isCompleted={true}
        onPracticeAgain={handlePracticeAgain}
        allRepetitionData={allRepetitionDataRef.current}
      />
    ) : (
      <PhotoFrameExercise
        vocabulary={vocabulary}
        currentRepetition={currentProgress?.currentRepetition || 1}
        totalRepetitions={currentProgress?.totalRepetitions || 1}
        sessionStartedAt={currentProgress?.startTime}
        sessionAnalytics={sessionAnalytics}
        analyticsLoading={analyticsLoading}
        onRepetitionComplete={handleCompleteRepetition}
        onExerciseComplete={handleComplete}
        isCompleted={true}
        onPracticeAgain={handlePracticeAgain}
        allRepetitionData={allRepetitionDataRef.current}
      />
    );
  }

  // ── Exercise in progress ──────────────────────────────────────────────────
  if (exerciseState === 'started' && currentProgress && vocabulary.length > 0) {
    return isCardMatchGame ? (
      <CardMatchExercise
        vocabulary={vocabulary}
        currentRepetition={currentProgress.currentRepetition}
        totalRepetitions={currentProgress.totalRepetitions}
        sessionStartedAt={currentProgress.startTime}
        sessionAnalytics={sessionAnalytics}
        analyticsLoading={analyticsLoading}
        onRepetitionComplete={handleCompleteRepetition}
        onExerciseComplete={handleComplete}
        allRepetitionData={allRepetitionDataRef.current}
      />
    ) : (
      <PhotoFrameExercise
        vocabulary={vocabulary}
        currentRepetition={currentProgress.currentRepetition}
        totalRepetitions={currentProgress.totalRepetitions}
        sessionStartedAt={currentProgress.startTime}
        sessionAnalytics={sessionAnalytics}
        analyticsLoading={analyticsLoading}
        onRepetitionComplete={handleCompleteRepetition}
        onExerciseComplete={handleComplete}
        allRepetitionData={allRepetitionDataRef.current}
      />
    );
  }

  // ── Start screen ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Target className="w-16 h-16 text-blue-500" />
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-500 animate-spin" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {planExercise?.exercise?.name ?? 'Word Adventure! 🎯'}
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            {isCardMatchGame
              ? 'Listen to the sound and pick the correct card.'
              : 'Learn words with pictures and sounds! 🎮'}
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <ExerciseStateBadge state={exerciseState} />
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 border-2 border-red-200 p-6 text-center">
            <p className="text-red-800 font-medium">{error}</p>
            <button onClick={() => setError(null)} className="mt-3 text-sm text-red-600 hover:text-red-800">
              Dismiss
            </button>
          </div>
        )}

        <div className="bg-white rounded-3xl p-8 shadow-2xl border-4 border-white">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 rounded-2xl bg-blue-50">
              <div className="text-2xl font-bold text-blue-700">{vocabulary.length}</div>
              <div className="text-sm text-blue-500">Words</div>
            </div>
            <div className="text-center p-4 rounded-2xl bg-purple-50">
              <div className="text-2xl font-bold text-purple-700">{planExercise?.repetition ?? 1}x</div>
              <div className="text-sm text-purple-500">Rounds</div>
            </div>
            <div className="text-center p-4 rounded-2xl bg-green-50">
              <div className="text-2xl font-bold text-green-700">{planExercise?.durationMinutes ?? '?'}</div>
              <div className="text-sm text-green-500">Minutes</div>
            </div>
          </div>

          {/* What to expect */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              What You'll Do:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="text-2xl">🎯</div>
                <div>
                  <p className="font-bold text-blue-800">See Pictures</p>
                  <p className="text-sm text-blue-700">Colorful images for each word</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="text-2xl">🔊</div>
                <div>
                  <p className="font-bold text-purple-800">Hear Pronunciations</p>
                  <p className="text-sm text-purple-700">Listen and repeat</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="text-2xl">📊</div>
                <div>
                  <p className="font-bold text-green-800">Track Progress</p>
                  <p className="text-sm text-green-700">Your results are saved for your therapist</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-yellow-50 to-orange-50">
                <div className="text-2xl">🎮</div>
                <div>
                  <p className="font-bold text-yellow-800">Multiple Rounds</p>
                  <p className="text-sm text-yellow-700">Practice {planExercise?.repetition ?? 1} round(s)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Word preview */}
          {vocabulary.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-bold text-gray-900 mb-4">
                You'll practice these {vocabulary.length} words:
              </h4>
              <div className="flex flex-wrap gap-2">
                {vocabulary.slice(0, 6).map((word) => (
                  <span key={word.id} className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 font-medium">
                    {word.wordEnglish}
                  </span>
                ))}
                {vocabulary.length > 6 && (
                  <span className="px-4 py-2 rounded-full bg-gray-100 text-gray-600">
                    +{vocabulary.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="text-center">
            <ExerciseActions
              state={exerciseState}
              onStart={handleStart}
              onComplete={() => handleComplete()}
              onPracticeAgain={handlePracticeAgain}
              isStarting={isStarting}
              isCompleting={isCompleting}
            />
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p className="flex items-center justify-center gap-2">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              Your progress is saved automatically!
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
