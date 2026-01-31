import type { ExerciseState } from '../../services/api/patient-exercises.api';

interface ExerciseStateBadgeProps {
  state: ExerciseState;
}

export function ExerciseStateBadge({ state }: ExerciseStateBadgeProps) {
  const config = {
    not_started: {
      label: 'Not Started',
      className: 'bg-slate-100 text-slate-700 ring-slate-200',
      dotClass: 'bg-slate-400',
    },
    started: {
      label: 'In Progress',
      className: 'bg-amber-50 text-amber-800 ring-amber-200',
      dotClass: 'bg-amber-500 animate-pulse',
    },
    completed: {
      label: 'Completed',
      className: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
      dotClass: 'bg-emerald-500',
    },
  };

  const { label, className, dotClass } = config[state];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ring-1 ${className}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}
