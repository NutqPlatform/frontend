import type { ExerciseState } from '../../services/api/patient-exercises.api';

interface ExerciseActionsProps {
  state: ExerciseState;
  onStart: () => void;
  onComplete: () => void;
  isStarting?: boolean;
  isCompleting?: boolean;
}

export function ExerciseActions({
  state,
  onStart,
  onComplete,
  isStarting = false,
  isCompleting = false,
}: ExerciseActionsProps) {
  const canStart = state === 'not_started';
  const canComplete = state === 'started';

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={onStart}
        disabled={!canStart || isStarting}
        className={`rounded-lg px-6 py-3 text-sm font-semibold shadow-sm transition-all ${
          canStart && !isStarting
            ? 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]'
            : 'cursor-not-allowed bg-slate-200 text-slate-500'
        }`}
      >
        {isStarting ? 'Starting...' : 'Start Exercise'}
      </button>
      <button
        onClick={onComplete}
        disabled={!canComplete || isCompleting}
        className={`rounded-lg px-6 py-3 text-sm font-semibold shadow-sm transition-all ${
          canComplete && !isCompleting
            ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]'
            : 'cursor-not-allowed bg-slate-200 text-slate-500'
        }`}
      >
        {isCompleting ? 'Completing...' : 'Complete Exercise'}
      </button>
    </div>
  );
}
