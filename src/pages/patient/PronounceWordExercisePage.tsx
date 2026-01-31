import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  getExerciseVocabulary,
  startExercise as apiStartExercise,
  completeExercise as apiCompleteExercise,
  getPatientProgress,
  deriveExerciseState,
  type VocabularyDto,
  type ExerciseState,
} from '../../services/api/patient-exercises.api';
import {
  VocabularyCard,
  ExerciseStateBadge,
  ExerciseActions,
} from '../../components/exercises';

const EXERCISE_NAME = 'Pronounce one word';

export function PronounceWordExercisePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { planId, planExerciseId } = useParams<{
    planId: string;
    planExerciseId: string;
  }>();

  const [vocabulary, setVocabulary] = useState<VocabularyDto[]>([]);
  const [exerciseState, setExerciseState] = useState<ExerciseState>('not_started');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const planIdNum = parseInt(planId ?? '0', 10);
  const planExerciseIdNum = parseInt(planExerciseId ?? '0', 10);

  const loadData = useCallback(async () => {
    if (!user?.id || !planIdNum || !planExerciseIdNum) return;
    if (user.role !== 'patient') {
      navigate('/dashboard');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [vocabList, progressList] = await Promise.all([
        getExerciseVocabulary(user.id, planExerciseIdNum),
        getPatientProgress(user.id),
      ]);
      setVocabulary(vocabList);
      setExerciseState(deriveExerciseState(progressList, planExerciseIdNum));
    } catch (err) {
      setError('Failed to load exercise. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.role, planExerciseIdNum, planIdNum, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStart = async () => {
    if (!user?.id || !planExerciseIdNum) return;
    setIsStarting(true);
    setError(null);
    try {
      await apiStartExercise(user.id, planExerciseIdNum);
      setExerciseState('started');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start exercise');
    } finally {
      setIsStarting(false);
    }
  };

  const handleComplete = async () => {
    if (!user?.id || !planExerciseIdNum) return;
    setIsCompleting(true);
    setError(null);
    try {
      await apiCompleteExercise(user.id, planExerciseIdNum);
      setExerciseState('completed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete exercise');
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="text-center text-slate-600">Loading exercise...</div>
        </div>
      </div>
    );
  }

  if (!planId || !planExerciseId || !user?.id) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg bg-amber-50 p-6 text-center text-amber-800">
            Invalid exercise. <button onClick={() => navigate('/patient/plans')} className="underline">Back to Plans</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/patient/plans')}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              ← Back to Plans
            </button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {EXERCISE_NAME}
              </h1>
              <p className="mt-0.5 text-sm text-slate-600">
                Practice pronouncing each word. Tap Play to hear the pronunciation.
              </p>
            </div>
          </div>
          <ExerciseStateBadge state={exerciseState} />
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-600">
            {exerciseState === 'not_started' && 'Start the exercise when you\'re ready to begin.'}
            {exerciseState === 'started' && 'You\'re making progress! Complete when you\'ve practiced all words.'}
            {exerciseState === 'completed' && 'Great job! You\'ve completed this exercise.'}
          </p>
          <ExerciseActions
            state={exerciseState}
            onStart={handleStart}
            onComplete={handleComplete}
            isStarting={isStarting}
            isCompleting={isCompleting}
          />
        </div>

        {/* Vocabulary list */}
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Words to practice (Fruits • Easy)
        </h2>
        {vocabulary.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-slate-600">No vocabulary available for this exercise.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vocabulary.map((word, index) => (
              <VocabularyCard key={word.id} word={word} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
