import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getPatientDashboard } from '../services/api/dashboard.api';
import type { PatientDashboardDto } from '../services/api/dashboard.api';


export function PatientDashboard() {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<PatientDashboardDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id && user?.role === 'patient') {
      loadDashboard();
    }
  }, [user]);

  const loadDashboard = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getPatientDashboard(user.id);
      setDashboardData(data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Patient Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">Welcome, {user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Therapy Plans */}
        {dashboardData.length === 0 ? (
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">No therapy plans assigned yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {dashboardData.map((plan) => (
              <div
                key={plan.planId}
                className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200"
              >
                <h2 className="mb-4 text-xl font-semibold">{plan.planName}</h2>

                {plan.exercises.length === 0 ? (
                  <p className="text-sm text-slate-600">No exercises in this plan.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                            Exercise
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                            Score
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {plan.exercises.map((exercise, idx) => (
                          <tr key={idx}>
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                              {exercise.exerciseName}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                              {exercise.completed ? (
                                <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                                  Completed
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                              {exercise.score !== undefined && exercise.score !== null
                                ? `${exercise.score}%`
                                : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
