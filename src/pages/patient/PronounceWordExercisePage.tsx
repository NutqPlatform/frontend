import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  getExerciseVocabulary,
  startExercise as apiStartExercise,
  completeExercise as apiCompleteExercise,
  completeRepetition as apiCompleteRepetition,
  getPatientProgress,
  deriveExerciseState,
  type VocabularyDto,
  type ExerciseState,
  type ExerciseProgressDto,
} from '../../services/api/patient-exercises.api';
import {
  ExerciseStateBadge,
  ExerciseActions,
} from '../../components/exercises';
import { PhotoFrameExercise } from '../../components/exercises/PhotoFrameExercise';

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
  const [currentProgress, setCurrentProgress] = useState<ExerciseProgressDto | null>(null);
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
      
      // Find current progress for this exercise
      const progress = progressList.find((p) => p.planExerciseId === planExerciseIdNum);
      if (progress) {
        setCurrentProgress(progress);
      }
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
      await loadData(); // Reload to get current progress
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start exercise');
    } finally {
      setIsStarting(false);
    }
  };

  const handleCompleteRepetition = async () => {
    if (!user?.id || !planExerciseIdNum) return;
    try {
      await apiCompleteRepetition(user.id, planExerciseIdNum);
      await loadData(); // Reload to get updated progress
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete repetition');
      throw err;
    }
  };

  const handleComplete = async () => {
    if (!user?.id || !planExerciseIdNum) return;
    setIsCompleting(true);
    setError(null);
    try {
      await apiCompleteExercise(user.id, planExerciseIdNum);
      setExerciseState('completed');
      await loadData(); // Reload to get final state
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

  // Show exercise frame when started
  if (exerciseState === 'started' && currentProgress && vocabulary.length > 0) {
    return (
      <>
        <div className="mb-8 flex items-center justify-between gap-4 bg-white p-4 shadow-sm sticky top-0 z-10">
          <button
            onClick={() => navigate('/patient/plans')}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ← Back
          </button>
          <h1 className="text-xl font-semibold text-slate-900">{EXERCISE_NAME}</h1>
          <div className="w-20" /> {/* Spacer */}
        </div>
        <PhotoFrameExercise
          vocabulary={vocabulary}
          currentRepetition={currentProgress.currentRepetition}
          totalRepetitions={currentProgress.totalRepetitions}
          onRepetitionComplete={handleCompleteRepetition}
          onExerciseComplete={handleComplete}
        />
      </>
    );
  }

  // Show start/complete interface
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
                Practice pronouncing each word. You can repeat this exercise multiple times.
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
            {exerciseState === 'not_started' && 'Click "Start Exercise" to begin practicing pronunciation.'}
            {exerciseState === 'completed' && 'Great job! You\'ve completed this exercise. Click "Start Exercise" to practice again.'}
          </p>
          <ExerciseActions
            state={exerciseState}
            onStart={handleStart}
            onComplete={handleComplete}
            isStarting={isStarting}
            isCompleting={isCompleting}
          />
        </div>

        {/* Info */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-6">
          <h3 className="font-semibold text-blue-900 mb-2">How to use this exercise:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click "Start Exercise" to begin</li>
            <li>• You'll see each word with an image and audio pronunciation</li>
            <li>• Click "Play Pronunciation" to hear how to say the word</li>
            <li>• Use Previous/Next buttons to navigate through words</li>
            <li>• When you've seen all words in a repetition, click "Submit Repetition"</li>
            <li>• Complete all repetitions as assigned by your therapist</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
