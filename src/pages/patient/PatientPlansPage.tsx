import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getPatientDashboard } from '../../services/api/dashboard.api';
import type { PatientDashboardDto } from '../../services/api/dashboard.api';

export function PatientPlansPage() {
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
      loadPlans();
    }
  }, [user, navigate]);

  const loadPlans = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPatientDashboard(user.id);
      setPlans(data);
    } catch (err) {
      setError('Failed to load plans');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">Loading plans...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">My Plans</h1>
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

        {plans.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">No therapy plans assigned yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {plans.map((plan) => (
              <div
                key={plan.planId}
                className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{plan.planName}</h2>
                  {plan.planStatus && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {plan.planStatus}
                    </span>
                  )}
                </div>
                {(plan.progressPercentage ?? 0) >= 0 && (
                  <div className="mb-4">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium text-slate-700">Progress</span>
                      <span>{(plan.progressPercentage ?? 0).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${plan.progressPercentage ?? 0}%` }}
                      />
                    </div>
                  </div>
                )}
                {plan.exercises.length === 0 ? (
                  <p className="text-sm text-slate-600">No exercises in this plan.</p>
                ) : (
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-700">
                          Exercise
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-700">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-700">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-700">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {plan.exercises.map((ex, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">
                            {ex.exerciseName}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {ex.completed ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                                Completed
                              </span>
                            ) : ex.started ? (
                              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                                In Progress • Rep {ex.currentRepetition}/{ex.totalRepetitions}
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {ex.score != null ? `${ex.score}%` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {ex.exerciseName === 'Pronounce one word' && (
                              <button
                                onClick={() =>
                                  navigate(
                                    `/patient/exercise/${plan.planId}/${ex.planExerciseId}`
                                  )
                                }
                                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                              >
                                {ex.completed ? 'Review' : 'Practice'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
