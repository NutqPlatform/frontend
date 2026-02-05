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
import { Target, Trophy, Sparkles, Star, Heart } from 'lucide-react';

const EXERCISE_NAME = 'Word Adventure! 🎯';

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
  const [showCelebration, setShowCelebration] = useState(false);

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
    console.log('Starting exercise with:', {
      patientId: user.id,
      planExerciseId: planExerciseIdNum
    });
    
    await apiStartExercise(user.id, planExerciseIdNum);
    setExerciseState('started');
    await loadData(); // Reload to get current progress
    
  } catch (err: any) {
    console.error('Start exercise error details:', {
      error: err,
      response: err.response?.data,
      status: err.response?.status
    });
    
    const errorMessage = err.response?.data?.error || 
                       err.response?.data?.message || 
                       err.message || 
                       'Failed to start adventure!';
    setError(`Failed to start: ${errorMessage}`);
  } finally {
    setIsStarting(false);
  }
};
  const handleCompleteRepetition = async () => {
    if (!user?.id || !planExerciseIdNum) return;
    try {
      await apiCompleteRepetition(user.id, planExerciseIdNum);
      await loadData();
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
      setShowCelebration(true);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete mission!');
    } finally {
      setIsCompleting(false);
    }
  };

  const handlePracticeAgain = () => {
    setExerciseState('not_started');
    setShowCelebration(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="mb-4 text-6xl">✨</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Adventure...</h2>
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
        <h2 className="text-xl font-bold text-yellow-800">Oops! Invalid adventure.</h2>
        <p className="text-yellow-700 mt-2">Let's go back to find more fun!</p>
        <button 
          onClick={() => navigate('/patient/plans')}
          className="mt-4 px-6 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold hover:shadow-lg transition-all"
        >
          Find Adventure
        </button>
      </div>
    );
  }

  // Show celebration screen
  if (showCelebration || exerciseState === 'completed') {
    return (
      <PhotoFrameExercise
        vocabulary={vocabulary}
        currentRepetition={currentProgress?.currentRepetition || 1}
        totalRepetitions={currentProgress?.totalRepetitions || 1}
        onRepetitionComplete={handleCompleteRepetition}
        onExerciseComplete={handleComplete}
        isCompleted={true}
        onPracticeAgain={handlePracticeAgain}
      />
    );
  }

  // Show exercise frame when started
  if (exerciseState === 'started' && currentProgress && vocabulary.length > 0) {
    return (
      <PhotoFrameExercise
        vocabulary={vocabulary}
        currentRepetition={currentProgress.currentRepetition}
        totalRepetitions={currentProgress.totalRepetitions}
        onRepetitionComplete={handleCompleteRepetition}
        onExerciseComplete={handleComplete}
      />
    );
  }

  // Show start screen
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header with fun design */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Target className="w-16 h-16 text-blue-500" />
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-500 animate-spin" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {EXERCISE_NAME}
          </h1>
          <p className="mt-2 text-lg text-gray-600">Learn words in a fun way! 🎮</p>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center mb-8">
          <ExerciseStateBadge state={exerciseState} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 p-6 text-center">
            <div className="text-3xl mb-2">😟</div>
            <p className="text-red-800 font-medium">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-3 text-sm text-red-600 hover:text-red-800"
            >
              Try again
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border-4 border-white">
          {/* What to Expect */}
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
                <div className="text-2xl">🏆</div>
                <div>
                  <p className="font-bold text-green-800">Earn Stars</p>
                  <p className="text-sm text-green-700">Get rewards for progress</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-yellow-50 to-orange-50">
                <div className="text-2xl">🎮</div>
                <div>
                  <p className="font-bold text-yellow-800">Play Multiple Times</p>
                  <p className="text-sm text-yellow-700">Practice as much as you want!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Word Preview */}
          {vocabulary.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-bold text-gray-900 mb-4">
                You'll learn these {vocabulary.length} words:
              </h4>
              <div className="flex flex-wrap gap-2">
                {vocabulary.slice(0, 5).map((word, index) => (
                  <span 
                    key={index}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 font-medium"
                  >
                    {word.wordEnglish}
                  </span>
                ))}
                {vocabulary.length > 5 && (
                  <span className="px-4 py-2 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700">
                    +{vocabulary.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="text-center">
            <ExerciseActions
              state={exerciseState}
              onStart={handleStart}
              onComplete={handleComplete}
              onPracticeAgain={handlePracticeAgain}
              isStarting={isStarting}
              isCompleting={isCompleting}
            />
          </div>

          {/* Fun Footer */}
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