import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getPatientDashboard } from '../../services/api/dashboard.api';
import type { PatientDashboardDto } from '../../services/api/dashboard.api';
import { Calendar, Target, TrendingUp, Play, CheckCircle, Clock, FileText } from 'lucide-react';

export function PatientPlansPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PatientDashboardDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

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

  const filteredPlans = plans.filter(plan => {
    if (activeFilter === 'archived') return plan.isArchived;
    if (plan.isArchived) return false;
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return plan.planStatus === 'Active';
    if (activeFilter === 'completed') return plan.planStatus === 'Completed';
    if (activeFilter === 'paused') return plan.planStatus === 'Paused';
    return true;
  });

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-gray-200 rounded mt-2 animate-pulse" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Therapy Plans</h1>
            <p className="mt-2 text-gray-600">Track and manage all your therapy plans</p>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              {plans.length} plan{plans.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600">⚠️</span>
            </div>
            <div>
              <p className="font-medium text-red-900">{error}</p>
              <button 
                onClick={loadPlans}
                className="text-sm text-red-600 hover:text-red-800 mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeFilter === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          All Plans
        </button>
        <button
          onClick={() => setActiveFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeFilter === 'active'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setActiveFilter('completed')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeFilter === 'completed'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => setActiveFilter('paused')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeFilter === 'paused'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Paused
        </button>
        <button
          onClick={() => setActiveFilter('archived')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeFilter === 'archived'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Archived
        </button>
      </div>

      {/* Plans List */}
      {filteredPlans.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-gray-200">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Target className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {activeFilter === 'all' ? 'No Therapy Plans Yet' : `No ${activeFilter} plans`}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {activeFilter === 'all' 
              ? 'Your therapist will assign plans to help you with your therapy journey.'
              : `You don't have any ${activeFilter} plans at the moment.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPlans.map((plan) => (
            <div
              key={plan.planId}
              className="group rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${
                      plan.planStatus === 'Active' ? 'bg-green-100 text-green-600' :
                      plan.planStatus === 'Completed' ? 'bg-blue-100 text-blue-600' :
                      plan.planStatus === 'Paused' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <Target size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{plan.planName}</h2>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <FileText size={14} />
                          {plan.exercises?.length || 0} exercises
                        </span>
                        {plan.exercises && plan.exercises.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {plan.exercises.filter(e => !e.completed).length} pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    plan.isArchived
                      ? 'bg-slate-100 text-slate-700'
                      : plan.planStatus === 'Active'
                      ? 'bg-green-100 text-green-700'
                      : plan.planStatus === 'Completed'
                      ? 'bg-blue-100 text-blue-700'
                      : plan.planStatus === 'Paused'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {plan.isArchived ? 'Archived' : plan.planStatus}
                  </span>
                  {!plan.isArchived && (
                  <button
                    onClick={() => {
                      const availableExercise = plan.exercises?.find(e => !e.completed);
                      if (availableExercise) {
                        navigate(`/patient/exercise/${plan.planId}/${availableExercise.planExerciseId}`);
                      } else if (plan.exercises?.length > 0) {
                        navigate(`/patient/exercise/${plan.planId}/${plan.exercises[0].planExerciseId}`);
                      }
                    }}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all flex items-center gap-2"
                  >
                    <Play size={16} />
                    {plan.exercises?.some(e => !e.completed) ? 'Continue' : 'Review'}
                  </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {(plan.progressPercentage ?? 0) >= 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-gray-500" />
                      <span className="font-medium text-gray-700">Progress</span>
                    </div>
                    <span className="font-bold text-gray-900">{plan.progressPercentage?.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-gray-900 transition-all duration-700"
                      style={{ width: `${plan.progressPercentage ?? 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Exercises */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle size={18} />
                  Exercises ({plan.exercises?.length || 0})
                </h3>
                {(!plan.exercises || plan.exercises.length === 0) ? (
                  <div className="rounded-lg bg-gray-50 p-4 text-center">
                    <p className="text-gray-600">No exercises in this plan</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plan.exercises.map((ex, idx) => (
                      <div
                        key={idx}
                        className="group/exercise rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 hover:bg-gray-50 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{ex.exerciseName}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                ex.completed
                                  ? 'bg-green-100 text-green-700'
                                  : ex.started
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {ex.completed ? 'Completed' : ex.started ? 'In Progress' : 'Pending'}
                              </span>
                              {ex.score != null && (
                                <span className="text-xs font-medium text-gray-700">Score: {ex.score}%</span>
                              )}
                            </div>
                          </div>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            ex.completed
                              ? 'bg-green-100 text-green-600'
                              : ex.started
                              ? 'bg-yellow-100 text-yellow-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {ex.completed ? (
                              <CheckCircle size={16} />
                            ) : ex.started ? (
                              <Clock size={16} />
                            ) : (
                              <Clock size={16} />
                            )}
                          </div>
                        </div>
                        
                        {ex.started && !ex.completed && (
                          <div className="text-xs text-gray-600 mb-3">
                            Repetition {ex.currentRepetition || 0} of {ex.totalRepetitions || 0}
                          </div>
                        )}
                        
                        {!plan.isArchived ? (
                        <button
                          onClick={() => navigate(`/patient/exercise/${plan.planId}/${ex.planExerciseId}`)}
                          className="w-full py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
                        >
                          {ex.completed ? 'Review Exercise' : 'Start Practice'}
                        </button>
                        ) : (
                        <p className="text-xs text-gray-500 text-center py-2">Statistics preserved from archived plan</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {plans.length > 0 && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Active Plans</div>
            <div className="text-2xl font-bold text-gray-900">
              {plans.filter(p => !p.isArchived && p.planStatus === 'Active').length}
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Exercises Completed</div>
            <div className="text-2xl font-bold text-gray-900">
              {plans.reduce((acc, plan) => 
                acc + (plan.exercises?.filter(e => e.completed).length || 0), 0
              )}
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Average Progress</div>
            <div className="text-2xl font-bold text-gray-900">
              {(plans.reduce((acc, plan) => acc + (plan.progressPercentage || 0), 0) / plans.length).toFixed(1)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}