import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getPatientDashboard } from '../../services/api/dashboard.api';
import type { PatientDashboardDto } from '../../services/api/dashboard.api';

export function PatientStatisticsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PatientDashboardDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role && user.role !== 'patient') {
      navigate('/dashboard');
      return;
    }
    if (user?.id && user?.role === 'patient') {
      loadData();
    }
  }, [user, navigate]);

  const loadData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPatientDashboard(user.id);
      setPlans(data);
    } catch (err) {
      setError('Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const totalExercises = plans.reduce((sum, p) => sum + p.exercises.length, 0);
  const completedExercises = plans.reduce(
    (sum, p) => sum + p.exercises.filter((e) => e.completed).length,
    0
  );
  const overallProgress =
    totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;
  const plansCount = plans.length;
  const activePlans = plans.filter((p) => p.planStatus === 'Active').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">Loading statistics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Performance Statistics</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm font-medium text-slate-600">Total Plans</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{plansCount}</div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm font-medium text-slate-600">Active Plans</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{activePlans}</div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm font-medium text-slate-600">Exercises Completed</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">
              {completedExercises} / {totalExercises}
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm font-medium text-slate-600">Overall Progress</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">
              {overallProgress.toFixed(1)}%
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        {plans.length > 0 && (
          <div className="mt-8 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-4 text-xl font-semibold">Progress by Plan</h2>
            <div className="space-y-4">
              {plans.map((plan) => (
                <div key={plan.planId}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-slate-900">{plan.planName}</span>
                    <span className="text-slate-600">
                      {(plan.progressPercentage ?? 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${plan.progressPercentage ?? 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
