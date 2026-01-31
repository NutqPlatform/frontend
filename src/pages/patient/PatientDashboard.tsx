import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getPatientDashboard } from '../../services/api/dashboard.api';
import type { PatientDashboardDto } from '../../services/api/dashboard.api';

export function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<PatientDashboardDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role && user.role !== 'patient') {
      navigate('/dashboard');
      return;
    }
    if (user?.id && user?.role === 'patient') {
      loadDashboard();
    }
  }, [user, navigate]);

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

  // Current plan = first active plan or first plan
  const currentPlan = dashboardData.find((p) => p.planStatus === 'Active') ?? dashboardData[0];

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

        {/* Navigation Icons */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <button
            onClick={() => navigate('/patient/plans')}
            className="group flex flex-col items-center justify-center rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:shadow-md"
          >
            <div className="mb-4 text-5xl">📋</div>
            <div className="text-lg font-medium text-slate-900">Plans</div>
            <div className="mt-1 text-sm text-slate-600">View all therapy plans</div>
          </button>
          <button
            onClick={() => navigate('/patient/statistics')}
            className="group flex flex-col items-center justify-center rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:shadow-md"
          >
            <div className="mb-4 text-5xl">📊</div>
            <div className="text-lg font-medium text-slate-900">Performance</div>
            <div className="mt-1 text-sm text-slate-600">View your statistics</div>
          </button>
          <button
            onClick={() => navigate('/patient/profile')}
            className="group flex flex-col items-center justify-center rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:shadow-md"
          >
            <div className="mb-4 text-5xl">👤</div>
            <div className="text-lg font-medium text-slate-900">Profile</div>
            <div className="mt-1 text-sm text-slate-600">Edit your profile</div>
          </button>
        </div>

        {/* Current Plan & Progress */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-xl font-semibold">Current Plan</h2>
          {!currentPlan ? (
            <p className="text-sm text-slate-600">No therapy plan assigned yet.</p>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  {currentPlan.planName}
                </h3>
                {currentPlan.planStatus && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                    {currentPlan.planStatus}
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {(currentPlan.progressPercentage ?? 0) >= 0 && (
                <div className="mb-6">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">Your Progress</span>
                    <span className="text-slate-600">
                      {(currentPlan.progressPercentage ?? 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${currentPlan.progressPercentage ?? 0}%` }}
                    />
                  </div>
                </div>
              )}

              {currentPlan.exercises.length === 0 ? (
                <p className="text-sm text-slate-600">No exercises in this plan yet.</p>
              ) : (
                <div className="mb-6 overflow-x-auto">
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
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {currentPlan.exercises.map((exercise, idx) => (
                        <tr key={idx}>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                            {exercise.exerciseName}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                            {exercise.completed ? (
                              <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                                Completed
                              </span>
                            ) : exercise.started ? (
                              <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                                In Progress
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
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            {exercise.exerciseName === 'Pronounce one word' && (
                              <button
                                onClick={() =>
                                  navigate(
                                    `/patient/exercise/${currentPlan.planId}/${exercise.planExerciseId}`
                                  )
                                }
                                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                              >
                                {exercise.completed ? 'Review' : 'Practice'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <button
                onClick={() => navigate('/patient/plans')}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
              >
                Continue with Plan →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
