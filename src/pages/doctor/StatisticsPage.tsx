import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getDoctorAnalytics, getOngoingPlans, getDoctorPatients } from '../../services/api/dashboard.api';
import type { DoctorAnalyticsDto, OngoingPlan, Patient } from '../../services/api/dashboard.api';
import {
  Users, FileText, Activity, TrendingUp,
  Target,
  User, ChevronRight, Play, LineChart
} from 'lucide-react';

export function StatisticsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<DoctorAnalyticsDto | null>(null);
  const [plans, setPlans] = useState<OngoingPlan[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id && user?.role === 'doctor') {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const [analyticsData, plansData, patientsData] = await Promise.all([
        getDoctorAnalytics(user.id),
        getOngoingPlans(user.id),
        getDoctorPatients(user.id),
      ]);
      setAnalytics(analyticsData);
      setPlans(plansData);
      setPatients(patientsData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      icon: <Users className="w-6 h-6" />,
      label: 'Total Patients',
      value: analytics?.totalPatients || 0,
      bgColor: 'bg-gray-50',
      iconColor: 'text-gray-900',
      borderColor: 'border-gray-200'
    },
    {
      icon: <FileText className="w-6 h-6" />,
      label: 'Active Plans',
      value: plans.filter(p => p.status === 'Active').length,
      bgColor: 'bg-gray-50',
      iconColor: 'text-gray-900',
      borderColor: 'border-gray-200'
    },
    {
      icon: <Activity className="w-6 h-6" />,
      label: 'Total Exercises',
      value: analytics?.totalExercises || 0,
      bgColor: 'bg-gray-50',
      iconColor: 'text-gray-900',
      borderColor: 'border-gray-200'
    },
    {
      icon: <Target className="w-6 h-6" />,
      label: 'Completion Rate',
      value: `${analytics?.averageCompletionRate.toFixed(1) || 0}%`,
      bgColor: 'bg-gray-50',
      iconColor: 'text-gray-900',
      borderColor: 'border-gray-200'
    }
  ];
  const activePlans = plans.filter(p => p.status === 'Active')
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 bg-gray-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
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
            <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
            <p className="mt-2 text-gray-600">Monitor your practice performance and patient activities</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600">⚠️</span>
            </div>
            <div>
              <p className="font-medium text-red-900">{error}</p>
              <button
                onClick={loadDashboardData}
                className="text-sm text-red-600 hover:text-red-800 mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
          >
            <div className="relative">
              {/* Icon */}
              <div className={`w-14 h-14 rounded-lg ${stat.bgColor} border ${stat.borderColor} flex items-center justify-center mb-4`}>
                <div className={stat.iconColor}>
                  {stat.icon}
                </div>
              </div>

              {/* Value */}
              <div className="mb-2">
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
              </div>

              {/* Status */}
              <div className="flex items-center gap-1 mt-4">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Monitoring
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Patients */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Plans Section */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Active Therapy Plans</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {activePlans.length} active plan {activePlans.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => navigate('/doctor/plans')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all"
              >
                <ChevronRight size={16} />
                View All
              </button>
            </div>

            {activePlans.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <FileText size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Plans</h3>
                <p className="text-gray-600">Start by creating therapy plans for your patients</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activePlans.slice(0, 3).map((plan) => (
                  <div
                    key={plan.id}
                    className="group flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-100 text-green-600">
                        <Play size={20} />
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900">
                          {plan.description || 'Untitled Plan'}
                        </h4>

                        <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                          {plan.patientName && (
                            <span className="flex items-center gap-1">
                              <User size={14} />
                              {plan.patientName}
                            </span>
                          )}

                          {plan.progressPercentage !== undefined && (
                            <span className="font-medium">
                              {plan.progressPercentage.toFixed(1)}% complete
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        plan.patientId &&
                        navigate(`/doctor/patients/${plan.patientId}`)
                      }
                      className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Patient Training Analytics */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Training Progress Analytics</h2>
                <p className="text-sm text-gray-600 mt-1">
                  View longitudinal session progress and category trends per patient
                </p>
              </div>
              <LineChart className="w-5 h-5 text-gray-400" />
            </div>

            {patients.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <User size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Patients Yet</h3>
                <p className="text-gray-600">Invite patients to start tracking training progress</p>
              </div>
            ) : (
              <div className="space-y-3">
                {patients.slice(0, 5).map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{patient.name}</p>
                      <p className="text-sm text-gray-600">{patient.email}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/doctor/patients/${patient.id}/analytics`)}
                      className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                    >
                      View Analytics
                      <ChevronRight size={16} />
                    </button>
                  </div>
                ))}
                {patients.length > 5 && (
                  <button
                    onClick={() => navigate('/doctor/patients')}
                    className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
                  >
                    View all patients →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Quick Actions & Patients */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-xl bg-gray-900 p-6 text-white">

            <div className="space-y-3">
              <button
                onClick={() => navigate('/doctor/patients/invitation-code')}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/20">
                    <User size={18} />
                  </div>
                  <span className="font-medium">Invite Patient</span>
                </div>
                <ChevronRight size={18} className="opacity-60" />
              </button>
            </div>
          </div>

          {/* Recent Patients */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Recent Patients</h3>
              <span className="text-sm text-gray-600">{patients.length} total</span>
            </div>

            {patients.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                  <User size={20} className="text-gray-400" />
                </div>
                <p className="text-gray-600">No patients yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {patients.slice(0, 4).map((patient) => (
                  <div
                    key={patient.id}
                    className="group flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <User size={18} className="text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{patient.name}</h4>
                      <p className="text-xs text-gray-600 truncate">{patient.email}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600" />
                  </div>
                ))}
                {patients.length > 4 && (
                  <button
                    onClick={() => navigate('/doctor/patients')}
                    className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
                  >
                    View all patients →
                  </button>
                )}
              </div>
            )}
          </div>


        </div>
      </div>
      {/* Bottom metrics removed — no reliable backend endpoints available to compute these. */}
    </div>
  );
}