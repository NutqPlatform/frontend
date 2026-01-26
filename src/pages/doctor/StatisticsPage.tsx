import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getDoctorAnalytics } from '../../services/api/dashboard.api';
import type { DoctorAnalyticsDto } from '../../services/api/dashboard.api';

export function StatisticsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<DoctorAnalyticsDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id && user?.role === 'doctor') {
      loadStatistics();
    }
  }, [user]);

  const loadStatistics = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const analyticsData = await getDoctorAnalytics(user.id);
      setAnalytics(analyticsData);
    } catch (err) {
      setError('Failed to load statistics');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">Loading statistics...</div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">Failed to load statistics</div>
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
            <h1 className="text-3xl font-semibold tracking-tight">Statistics</h1>
            <p className="mt-1 text-sm text-slate-600">View your practice analytics</p>
          </div>
          <button
            onClick={() => navigate('/doctor')}
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm font-medium text-slate-600">Total Patients</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">
              {analytics.totalPatients}
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm font-medium text-slate-600">Total Plans</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">
              {analytics.totalPlans}
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm font-medium text-slate-600">Total Exercises</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">
              {analytics.totalExercises}
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm font-medium text-slate-600">Avg. Completion Rate</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">
              {analytics.averageCompletionRate.toFixed(1)}%
            </div>
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${analytics.averageCompletionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
