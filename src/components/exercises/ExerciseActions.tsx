import type { ExerciseState } from '../../services/api/patient-exercises.api';
import { Play, Sparkles } from 'lucide-react'; // Removed Trophy import

interface ExerciseActionsProps {
  state: ExerciseState;
  onStart: () => void;
  onComplete: () => void;
  onPracticeAgain?: () => void; // New prop for practicing again
  isStarting?: boolean;
  isCompleting?: boolean;
}

export function ExerciseActions({
  state,
  onStart,
  onComplete,
  onPracticeAgain,
  isStarting = false,
  isCompleting = false,
}: ExerciseActionsProps) {
  const canStart = state === 'not_started';
  const canComplete = state === 'started';
  const isCompleted = state === 'completed';

  return (
    <div className="flex flex-wrap gap-4">
      {/* Practice Again Button (only when completed) */}
      {isCompleted && onPracticeAgain && (
        <button
          onClick={onPracticeAgain}
          className="group relative overflow-hidden rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-3"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/20 group-hover:to-pink-600/20 transition-all duration-300" />
          <Sparkles className="w-5 h-5" />
          Practice Again!
        </button>
      )}

      {/* Start/Continue Button */}
      {!isCompleted && (
        <button
          onClick={onStart}
          disabled={!canStart || isStarting}
          className={`group relative overflow-hidden rounded-full px-8 py-4 font-bold shadow-lg transition-all duration-300 flex items-center gap-3 ${
            canStart && !isStarting
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-xl hover:scale-105'
              : 'cursor-not-allowed bg-gray-200 text-gray-500'
          }`}
        >
          {canStart && !isStarting && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-cyan-600/0 group-hover:from-blue-600/20 group-hover:to-cyan-600/20 transition-all duration-300" />
          )}
          <Play className="w-5 h-5" />
          {isStarting ? 'Starting...' : canStart ? 'Start Adventure!' : 'In Progress...'}
        </button>
      )}

      {/* Complete Button (only when started) */}
      {canComplete && (
        <button
          onClick={onComplete}
          disabled={!canComplete || isCompleting}
          className={`group relative overflow-hidden rounded-full px-8 py-4 font-bold shadow-lg transition-all duration-300 flex items-center gap-3 ${
            canComplete && !isCompleting
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-xl hover:scale-105'
              : 'cursor-not-allowed bg-gray-200 text-gray-500'
          }`}
        >
          {canComplete && !isCompleting && (
            <div className="absolute inset-0 bg-gradient-to-r from-green-600/0 to-emerald-600/0 group-hover:from-green-600/20 group-hover:to-emerald-600/20 transition-all duration-300" />
          )}
          <span className="text-2xl">🏆</span> {/* Changed Trophy icon to emoji */}
          {isCompleting ? 'Finishing...' : 'Finish Mission!'}
        </button>
      )}
    </div>
  );
}