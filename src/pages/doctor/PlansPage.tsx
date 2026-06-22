import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getOngoingPlans } from '../../services/api/dashboard.api';
import { createWeeklyReport, updateWeeklyReport, getReportByPlan, type WeeklyReportDto } from '../../services/api/weeklyReport.api';
import type { OngoingPlan } from '../../services/api/dashboard.api';
import { Calendar, FileText, Users, Activity, Target, BarChart, Clock, CheckCircle, Play, Pause, AlertCircle, Filter, Search, ChevronRight, Plus, MoreVertical } from 'lucide-react';

export function PlansPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<OngoingPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<OngoingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportsByPlan, setReportsByPlan] = useState<Record<number, WeeklyReportDto | null>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPlan, setSelectedPlan] = useState<OngoingPlan | null>(null);

  useEffect(() => {
    if (user?.id && user?.role === 'doctor') {
      loadPlans();
    }
  }, [user]);

  useEffect(() => {
    filterPlans();
  }, [plans, searchTerm, statusFilter]);

  const loadPlans = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const plansData = await getOngoingPlans(user.id);
      setPlans(plansData);

      const reports: Record<number, WeeklyReportDto | null> = {};
      for (const plan of plansData) {
        try {
          const report = await getReportByPlan(plan.id);
          reports[plan.id] = report;
        } catch {
          reports[plan.id] = null;
        }
      }
      setReportsByPlan(reports);
    } catch (err) {
      setError('Failed to load plans');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterPlans = () => {
    let filtered = [...plans];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(plan =>
        (plan.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (plan.patientName || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(plan => plan.status === statusFilter);
    }

    setFilteredPlans(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <Play className="w-4 h-4" />;
      case 'Paused':
        return <Pause className="w-4 h-4" />;
      case 'Completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-700';
      case 'Paused':
        return 'bg-yellow-100 text-yellow-700';
      case 'Completed':
        return 'bg-blue-100 text-blue-700';
      case 'Ended':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const handleSaveReport = async (plan: OngoingPlan) => {
    if (!user?.id || !plan.patientId) return;

    const report = reportsByPlan[plan.id];
    const notes = window.prompt(
      `Enter weekly report notes${report ? ' (edit mode)' : ''}:`,
      report?.doctorNotes || ''
    );
    
    if (notes === null) return;

    try {
      const start = plan.startDate || new Date().toISOString();
      const end = plan.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      if (report) {
        await updateWeeklyReport(report.id, {
          doctorId: user.id,
          patientId: plan.patientId,
          therapyPlanId: plan.id,
          startDate: start,
          endDate: end,
          totalHours: 0,
          doctorNotes: notes,
        });
      } else {
        await createWeeklyReport({
          doctorId: user.id,
          patientId: plan.patientId,
          therapyPlanId: plan.id,
          startDate: start,
          endDate: end,
          totalHours: 0,
          doctorNotes: notes,
        });
      }
      
      await loadPlans();
    } catch (err) {
      console.error(err);
      alert('Failed to save weekly report');
    }
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-gray-200 rounded mt-2 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
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
            <h1 className="text-3xl font-bold text-gray-900">Therapy Plans</h1>
            <p className="mt-2 text-gray-600">Monitor and manage all ongoing therapy plans</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/doctor/patients')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 px-5 py-3 text-white font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <Plus size={18} />
              New Plan
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Plans</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{plans.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {plans.filter(p => p.status === 'Active').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Progress</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {plans.length > 0 
                  ? `${(plans.reduce((acc, plan) => acc + (plan.progressPercentage || 0), 0) / plans.length).toFixed(1)}%`
                  : '0%'
                }
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <BarChart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Reports</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {Object.values(reportsByPlan).filter((r) => r?.id).length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-600" />
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

      {/* Filters */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search plans by description or patient name..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 appearance-none"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Completed">Completed</option>
                <option value="Ended">Ended</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      {filteredPlans.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-gray-200">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          {searchTerm || statusFilter !== 'all' ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No matching plans</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search criteria</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-white font-medium hover:bg-gray-800 transition-all"
              >
                Clear Filters
              </button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No therapy plans</h3>
              <p className="text-gray-600 mb-6">Start by creating your first therapy plan</p>
              <button
                onClick={() => navigate('/doctor/patients')}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-white font-medium hover:bg-gray-800 transition-all"
              >
                <Plus size={18} />
                Create First Plan
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="group rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              {/* Plan Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg ${getStatusColor(plan.status || '')} flex items-center justify-center`}>
                      {getStatusIcon(plan.status || '')}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                        {plan.description || 'Untitled Plan'}
                      </h3>
                      {plan.patientName && (
                        <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                          <Users size={14} />
                          {plan.patientName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedPlan(selectedPlan?.id === plan.id ? null : plan)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {(plan.progressPercentage || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-gradient-to-r from-gray-900 to-gray-700 rounded-full transition-all duration-500"
                    style={{ width: `${plan.progressPercentage || 0}%` }}
                  />
                </div>
              </div>

              {/* Plan Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={14} />
                    <span>Start Date</span>
                  </div>
                  <span className="font-medium text-gray-900">{formatDate(plan.startDate)}</span>
                </div>
                
                {plan.endDate && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Target size={14} />
                      <span>End Date</span>
                    </div>
                    <span className="font-medium text-gray-900">{formatDate(plan.endDate)}</span>
                  </div>
                )}
                
                {plan.exercises && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Activity size={14} />
                      <span>Exercises</span>
                    </div>
                    <span className="font-medium text-gray-900">{plan.exercises.length}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {plan.patientId && (
                  <button
                    onClick={() => navigate(`/doctor/patients/${plan.patientId}`)}
                    className="w-full flex items-center justify-between group/patient p-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Users size={14} className="text-gray-600" />
                      </div>
                      <span className="font-medium text-gray-700">View Patient</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover/patient:text-gray-600" />
                  </button>
                )}

                {/* Report Button */}
                {(plan.status === 'Completed' || plan.status === 'Paused' || plan.status === 'Ended' || (plan.endDate && new Date(plan.endDate) < new Date())) && (
                  <button
                    onClick={() => handleSaveReport(plan)}
                    className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition-all ${
                      reportsByPlan[plan.id]
                        ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {reportsByPlan[plan.id] ? (
                      <>
                        <FileText size={16} />
                        Edit Weekly Report
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Add Weekly Report
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Selected Plan Actions */}
              {selectedPlan?.id === plan.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 animate-slide-down">
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        if (plan.patientId) {
                          navigate(`/doctor/patients/${plan.patientId}?plan=${plan.id}`);
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
                    >
                      View Plan Details
                    </button>
                    <button
                      onClick={() => handleSaveReport(plan)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
                    >
                      {reportsByPlan[plan.id] ? 'Update Report' : 'Create Report'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer Summary */}
      {filteredPlans.length > 0 && (
        <div className="mt-8 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Summary</h3>
              <p className="text-gray-300 text-sm">
                Showing {filteredPlans.length} of {plans.length} total plans
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {plans.filter(p => p.status === 'Active').length}
                </div>
                <div className="text-sm text-gray-300">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {plans.filter(p => p.status === 'Completed').length}
                </div>
                <div className="text-sm text-gray-300">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Object.values(reportsByPlan).filter((r) => r?.id).length}
                </div>
                <div className="text-sm text-gray-300">Reports</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}