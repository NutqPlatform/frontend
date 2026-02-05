import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getPatientDashboard } from '../../services/api/dashboard.api';
import type { PatientDashboardDto } from '../../services/api/dashboard.api';
import { Activity, TrendingUp, Calendar, Target, CheckCircle, Play, Clock } from 'lucide-react';

export function PatientDashboard() {
  const { user } = useAuth();
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

  const currentPlan = dashboardData.find((p) => p.planStatus === 'Active') ?? dashboardData[0];

  // Calculate actual stats from API data
  const totalExercises = currentPlan?.exercises?.length || 0;
  const completedExercises = currentPlan?.exercises?.filter(e => e.completed).length || 0;
  const todayExercises = currentPlan?.exercises?.filter(e => e.started && !e.completed).length || 0;
  const activePlans = dashboardData.filter(p => p.planStatus === 'Active').length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
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
            <h1 className="text-3xl font-bold text-gray-900">Your Therapy Dashboard</h1>
            <p className="mt-2 text-gray-600">Track your progress and continue your therapy journey</p>
          </div>
          <button 
            onClick={() => navigate('/patient/plans')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all"
          >
            <Play size={18} />
            Continue Therapy
          </button>
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
                onClick={loadDashboard}
                className="text-sm text-red-600 hover:text-red-800 mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="relative">
            <div className="w-14 h-14 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center mb-4">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div className="mb-2">
              <p className="text-3xl font-bold text-gray-900">{todayExercises}</p>
              <p className="text-sm text-gray-600 mt-1">Today's Exercises</p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="relative">
            <div className="w-14 h-14 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="mb-2">
              <p className="text-3xl font-bold text-gray-900">{completedExercises}/{totalExercises}</p>
              <p className="text-sm text-gray-600 mt-1">Completed</p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="relative">
            <div className="w-14 h-14 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="mb-2">
              <p className="text-3xl font-bold text-gray-900">{currentPlan?.progressPercentage?.toFixed(1) || 0}%</p>
              <p className="text-sm text-gray-600 mt-1">Progress</p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="relative">
            <div className="w-14 h-14 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-amber-600" />
            </div>
            <div className="mb-2">
              <p className="text-3xl font-bold text-gray-900">{activePlans}</p>
              <p className="text-sm text-gray-600 mt-1">Active Plans</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Plan Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Current Plan</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {currentPlan ? currentPlan.planName : 'No active plan'}
                </p>
              </div>
              {currentPlan?.planStatus && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  currentPlan.planStatus === 'Active'
                    ? 'bg-green-100 text-green-700'
                    : currentPlan.planStatus === 'Paused'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {currentPlan.planStatus}
                </span>
              )}
            </div>

            {!currentPlan ? (
              <div className="py-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Target className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Plan</h3>
                <p className="text-gray-600">Your therapist will assign a plan soon</p>
              </div>
            ) : (
              <>
                {/* Progress Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700">Your Progress</span>
                    <span className="font-bold text-gray-900">{currentPlan.progressPercentage?.toFixed(1) || 0}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-gray-900 transition-all duration-700"
                      style={{ width: `${currentPlan.progressPercentage || 0}%` }}
                    />
                  </div>
                </div>

                {/* Exercises List */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Today's Exercises</h3>
                  {currentPlan.exercises?.length === 0 ? (
                    <div className="rounded-lg bg-gray-50 p-4 text-center">
                      <p className="text-gray-600">No exercises assigned yet</p>
                    </div>
                  ) : (
                    currentPlan.exercises?.map((exercise, idx) => (
                      <div
                        key={idx}
                        className="group flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 hover:bg-gray-50 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            exercise.completed
                              ? 'bg-green-100 text-green-600'
                              : exercise.started
                              ? 'bg-yellow-100 text-yellow-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {exercise.completed ? (
                              <CheckCircle size={20} />
                            ) : exercise.started ? (
                              <Clock size={20} />
                            ) : (
                              <Target size={20} />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{exercise.exerciseName}</h4>
                            <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                              {exercise.completed ? (
                                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">
                                  Completed
                                </span>
                              ) : exercise.started ? (
                                <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs">
                                  Rep {exercise.currentRepetition || 0}/{exercise.totalRepetitions || 0}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                                  Pending
                                </span>
                              )}
                              {exercise.score != null && (
                                <span className="font-medium">Score: {exercise.score}%</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/patient/exercise/${currentPlan.planId}/${exercise.planExerciseId}`)}
                          className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100"
                        >
                          {exercise.completed ? 'Review' : 'Practice'}
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Action Button */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => navigate('/patient/plans')}
                    className="w-full py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    View All Plans
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Actions & Tips */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-xl bg-gray-900 p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/patient/plans')}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/20">
                    <Play size={18} />
                  </div>
                  <span className="font-medium">Continue Therapy</span>
                </div>
                <svg className="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/patient/reports')}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/20">
                    <CheckCircle size={18} />
                  </div>
                  <span className="font-medium">View Reports</span>
                </div>
                <svg className="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/patient/profile')}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/20">
                    <Activity size={18} />
                  </div>
                  <span className="font-medium">My Profile</span>
                </div>
                <svg className="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Daily Tip */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-yellow-100">
                <span className="text-yellow-600 text-xl">💡</span>
              </div>
              <h3 className="font-semibold text-gray-900">Daily Tip</h3>
            </div>
            <p className="text-sm text-gray-700">
              Practice pronunciation exercises in a quiet environment for better focus and results.
              Try to maintain consistent daily practice sessions.
            </p>
          </div>

          {/* Progress Goal */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Weekly Goal</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Exercises Completed</span>
                <span className="font-medium text-gray-900">{completedExercises}/10</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-gray-900"
                  style={{ width: `${Math.min(100, (completedExercises / 10) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Complete 10 exercises this week to earn a progress badge!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}