import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getAllExercises, addExerciseToPlan } from '../../services/api/exercises.api';
import type { Exercise } from '../../services/api/exercises.api';
import { createPlan, getPatientDetails } from '../../services/api/patients.api';
import type { PlanExerciseInput } from '../../services/api/patients.api';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { ArrowLeft, Search, Activity, Check, AlertCircle } from 'lucide-react';

export interface PlanDraft {
  description: string;
  startDate: string;
  endDate?: string;
}

interface ExerciseSelection {
  selected: boolean;
  repetition: number;
  durationMinutes: number;
}

export function PlanExerciseSelectionPage() {
  const { patientId, planId } = useParams<{ patientId: string; planId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isCreateMode = location.pathname.includes('/plans/new/');
  const planDraft = location.state?.planDraft as PlanDraft | undefined;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selections, setSelections] = useState<Record<number, ExerciseSelection>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormerPatient, setIsFormerPatient] = useState(false);

  useEffect(() => {
    if (!user?.id || user.role !== 'doctor') {
      navigate('/doctor');
      return;
    }
    if (isCreateMode && !planDraft) {
      navigate(`/doctor/patients/${patientId}`);
      return;
    }
    if (!isCreateMode && !planId) {
      navigate(`/doctor/patients/${patientId}`);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const idVal = parseInt(patientId || '', 10);
        if (isNaN(idVal)) {
          setError('Invalid patient ID');
          setIsLoading(false);
          return;
        }

        // Check if patient is former
        const patientData = await getPatientDetails(user.id, idVal);
        if (patientData.isFormer) {
          setIsFormerPatient(true);
          setError('This patient is no longer assigned to you. Plans and exercises cannot be modified.');
        }

        const data = await getAllExercises();
        setExercises(data);
        const initial: Record<number, ExerciseSelection> = {};
        data.forEach((ex) => {
          initial[ex.id] = { selected: false, repetition: 1, durationMinutes: 30 };
        });
        setSelections(initial);
      } catch (err: any) {
        setError(err?.response?.data?.error || err?.message || 'Failed to load exercises');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [user, isCreateMode, planDraft, planId, patientId, navigate]);

  const filteredExercises = useMemo(() => {
    if (!searchTerm.trim()) return exercises;
    const term = searchTerm.toLowerCase();
    return exercises.filter(
      (ex) =>
        ex.name.toLowerCase().includes(term) ||
        ex.description?.toLowerCase().includes(term) ||
        ex.category?.toLowerCase().includes(term)
    );
  }, [exercises, searchTerm]);

  const selectedExercises = useMemo(
    () =>
      Object.entries(selections)
        .filter(([, value]) => value.selected)
        .map(([id, value]) => ({
          exerciseId: Number(id),
          repetition: value.repetition,
          durationMinutes: value.durationMinutes,
        })),
    [selections]
  );

  const totalExerciseSlots = selectedExercises.reduce((sum, ex) => sum + ex.repetition, 0);

  const toggleExercise = (exerciseId: number) => {
    if (isFormerPatient) return;
    setSelections((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        selected: !prev[exerciseId]?.selected,
      },
    }));
  };

  const updateSelection = (exerciseId: number, updates: Partial<ExerciseSelection>) => {
    if (isFormerPatient) return;
    setSelections((prev) => ({
      ...prev,
      [exerciseId]: { ...prev[exerciseId], ...updates },
    }));
  };

  const handleSubmit = async () => {
    if (isFormerPatient) return;
    if (!user?.id || !patientId || selectedExercises.length === 0) {
      setError('Select at least one exercise for the plan.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const exercisePayload: PlanExerciseInput[] = selectedExercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        durationMinutes: ex.durationMinutes,
        repetition: ex.repetition,
      }));

      if (isCreateMode && planDraft) {
        await createPlan(user.id, parseInt(patientId, 10), {
          description: planDraft.description,
          startDate: new Date(planDraft.startDate),
          endDate: planDraft.endDate ? new Date(planDraft.endDate) : undefined,
          exercises: exercisePayload,
        });
      } else if (planId) {
        for (const ex of exercisePayload) {
          await addExerciseToPlan(parseInt(planId, 10), ex);
        }
      }

      navigate(`/doctor/patients/${patientId}`);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to save plan exercises');
    } finally {
      setIsSubmitting(false);
    }
  };

  const backPath = `/doctor/patients/${patientId}`;

  if (isLoading) {
    return (
      <div className="py-12 text-center text-gray-600">Loading exercises...</div>
    );
  }

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <button
        type="button"
        onClick={() => navigate(backPath)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={18} />
        Back to patient
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isCreateMode ? 'Select Exercises for New Plan' : 'Add Exercises to Plan'}
        </h1>
        <p className="mt-2 text-gray-600">
          A plan must include at least one exercise. Repetition adds independent copies of the same exercise for the patient.
        </p>
        {isCreateMode && planDraft && (
          <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-700">
            <p><span className="font-medium">Plan:</span> {planDraft.description}</p>
            <p><span className="font-medium">Start:</span> {new Date(planDraft.startDate).toLocaleDateString()}</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search exercises..."
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
          disabled={isFormerPatient}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredExercises.map((exercise) => {
          const selection = selections[exercise.id] ?? { selected: false, repetition: 1, durationMinutes: 30 };
          const imageSrc = resolveMediaUrl(exercise.imageUrl || exercise.assetUrl);

          return (
            <div
              key={exercise.id}
              className={`rounded-xl border bg-white overflow-hidden transition-all ${
                selection.selected ? 'border-gray-900 ring-2 ring-gray-900/10 shadow-md' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleExercise(exercise.id)}
                className="w-full text-left"
                disabled={isFormerPatient}
              >
                <div className="h-40 bg-gray-100 relative overflow-hidden">
                  {imageSrc ? (
                    <img src={imageSrc} alt={exercise.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Activity className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  {selection.selected && (
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{exercise.name}</h3>
                  {exercise.category && (
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {exercise.category}
                    </span>
                  )}
                  <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                    {exercise.description || 'No description available.'}
                  </p>
                </div>
              </button>

              {selection.selected && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Repetitions (independent sessions)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={selection.repetition}
                      onChange={(e) =>
                        updateSelection(exercise.id, {
                          repetition: Math.max(1, parseInt(e.target.value, 10) || 1),
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      disabled={isFormerPatient}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Repetition {selection.repetition} adds {selection.repetition} separate entries of this exercise.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Duration (minutes)</label>
                    <input
                      type="number"
                      min={1}
                      max={600}
                      value={selection.durationMinutes}
                      onChange={(e) =>
                        updateSelection(exercise.id, {
                          durationMinutes: Math.max(1, parseInt(e.target.value, 10) || 30),
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      disabled={isFormerPatient}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-4 rounded-xl bg-white border border-gray-200 shadow-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-700">
          <span className="font-semibold text-gray-900">{selectedExercises.length}</span> exercise type(s) selected
          {' · '}
          <span className="font-semibold text-gray-900">{totalExerciseSlots}</span> total session(s)
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || selectedExercises.length === 0 || isFormerPatient}
            className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {isSubmitting
              ? 'Saving...'
              : isCreateMode
                ? 'Create Plan'
                : 'Add to Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
