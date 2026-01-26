import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getOngoingPlans } from '../../services/api/dashboard.api';
import type { OngoingPlan } from '../../services/api/dashboard.api';

export function PlansPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<OngoingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id && user?.role === 'doctor') {
      loadPlans();
    }
  }, [user]);

  const loadPlans = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const plansData = await getOngoingPlans(user.id);
      setPlans(plansData);
    } catch (err) {
      setError('Failed to load plans');
      console.error(err);
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
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Ongoing Plans</h1>
            <p className="mt-1 text-sm text-slate-600">View and manage active therapy plans</p>
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

        {/* Plans List */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {plans.length === 0 ? (
            <div className="col-span-2 rounded-lg bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-600">No ongoing plans.</p>
            </div>
          ) : (
            plans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {plan.description || 'Untitled Plan'}
                    </h3>
                    {plan.patientName && (
                      <p className="mt-1 text-sm text-slate-600">Patient: {plan.patientName}</p>
                    )}
                  </div>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                    {plan.status}
                  </span>
                </div>

                {/* Progress Bar */}
                {plan.progressPercentage !== undefined && (
                  <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">Progress</span>
                      <span className="text-slate-600">{plan.progressPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${plan.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-sm text-slate-600">
                  <div>
                    <span className="font-medium">Start:</span>{' '}
                    {new Date(plan.startDate).toLocaleDateString()}
                  </div>
                  {plan.endDate && (
                    <div>
                      <span className="font-medium">End:</span>{' '}
                      {new Date(plan.endDate).toLocaleDateString()}
                    </div>
                  )}
                  {plan.exercises && (
                    <div>
                      <span className="font-medium">Exercises:</span> {plan.exercises.length}
                    </div>
                  )}
                </div>

                {plan.patientId && (
                  <button
                    onClick={() => navigate(`/doctor/patients/${plan.patientId}`)}
                    className="mt-4 w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    View Patient Details
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
