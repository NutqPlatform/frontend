import type { ExerciseState } from '../../services/api/patient-exercises.api';
import { Target, Play, Trophy } from 'lucide-react';

interface ExerciseStateBadgeProps {
  state: ExerciseState;
}

export function ExerciseStateBadge({ state }: ExerciseStateBadgeProps) {
  const config = {
    not_started: {
      label: 'Ready for Adventure!',
      className: 'bg-blue-100 text-blue-800 border-2 border-blue-300',
      icon: <Target className="w-4 h-4" />,
      dotClass: 'bg-blue-500',
    },
    started: {
      label: 'Adventure in Progress!',
      className: 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300',
      icon: <Play className="w-4 h-4" />,
      dotClass: 'bg-yellow-500 animate-pulse',
    },
    completed: {
      label: 'Mission Complete! 🎉',
      className: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-2 border-green-300',
      icon: <Trophy className="w-4 h-4" />,
      dotClass: 'bg-green-500',
    },
  };

  const { label, className, icon, dotClass } = config[state];

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${className}`}>
      <div className="flex items-center gap-2">
        <div className={`h-3 w-3 rounded-full ${dotClass}`} />
        {icon}
      </div>
      {label}
    </div>
  );
}