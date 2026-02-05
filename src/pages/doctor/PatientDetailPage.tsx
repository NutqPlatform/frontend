import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getPatientDetails, getPatientPlans, createPlan, updatePatientDiagnosis, deleteExerciseFromPlan, updatePlanStatus, getPlanProgress } from '../../services/api/patients.api';
import { getAllExercises, addExerciseToPlan } from '../../services/api/exercises.api';
import { createWeeklyReport, updateWeeklyReport, getReportByPlan } from '../../services/api/weeklyReport.api';
import type { PatientDetails, TherapyPlan } from '../../services/api/patients.api';
import type { Exercise, AddExerciseToPlanRequest } from '../../services/api/exercises.api';
import { 
  User, Calendar, Activity, Target, FileText, Plus, Edit2, 
  Trash2, CheckCircle, AlertCircle, ChevronRight, X 
} from 'lucide-react';

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [plans, setPlans] = useState<TherapyPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddPlanForm, setShowAddPlanForm] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [isEditingDiagnosis, setIsEditingDiagnosis] = useState(false);
  const [diagnosisValue, setDiagnosisValue] = useState('');
  const [isUpdatingDiagnosis, setIsUpdatingDiagnosis] = useState(false);
  const [planForm, setPlanForm] = useState({
    description: '',
    status: 'Active',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });
  const [planProgress, setPlanProgress] = useState<Record<number, number>>({});
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [showAddExerciseForm, setShowAddExerciseForm] = useState<number | null>(null);
  const [exerciseForm, setExerciseForm] = useState<AddExerciseToPlanRequest>({
    exerciseId: 0,
    durationMinutes: 30,
    repetition: 1,
    aiConstraints: '',
  });
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [reportsByPlan, setReportsByPlan] = useState<Record<number, any>>({});
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportNotes, setReportNotes] = useState('');
  const [isSavingReport, setIsSavingReport] = useState(false);

  useEffect(() => {
    if (user?.id && user?.role === 'doctor' && id) {
      loadPatientData();
    }
  }, [user, id]);

  const loadPatientData = async () => {
    if (!user?.id || !id) return;

    const patientId = parseInt(id);
    if (isNaN(patientId)) {
      setError('Invalid patient ID');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Loading patient:', { doctorId: user.id, patientId });
      
      const patientData = await getPatientDetails(user.id, patientId);
      setPatient(patientData);
      setDiagnosisValue(patientData.diagnosis || '');
      
      try {
        const [plansData, exercisesData] = await Promise.all([
          getPatientPlans(user.id, patientId),
          getAllExercises(),
        ]);
        setPlans(plansData);
        setAvailableExercises(exercisesData);
        
        const progressPromises = plansData.map(async (plan) => {
          try {
            const progress = await getPlanProgress(plan.id);
            return { planId: plan.id, progress: progress.progressPercentage };
          } catch {
            return { planId: plan.id, progress: 0 };
          }
        });
        const progressResults = await Promise.all(progressPromises);
        const progressMap: Record<number, number> = {};
        progressResults.forEach(({ planId, progress }) => {
          progressMap[planId] = progress;
        });
        setPlanProgress(progressMap);

        const reportPromises = plansData.map(async (plan) => {
          try {
            const report = await getReportByPlan(plan.id);
            return { planId: plan.id, report };
          } catch {
            return { planId: plan.id, report: null };
          }
        });
        const reportResults = await Promise.all(reportPromises);
        const reportMap: Record<number, any> = {};
        reportResults.forEach(({ planId, report }) => {
          reportMap[planId] = report;
        });
        setReportsByPlan(reportMap);
      } catch (plansErr: any) {
        console.warn('Failed to load plans:', plansErr);
        setPlans([]);
      }
    } catch (err: any) {
      console.error('Error loading patient:', err);
      const status = err?.response?.status;
      const errorData = err?.response?.data;
      
      if (status === 404) {
        const errorMessage = errorData?.error || 'Patient not found';
        setError(errorMessage);
        setPatient(null);
      } else {
        const errorMessage = errorData?.error || err?.message || 'Failed to load patient data';
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !id) return;

    setIsCreatingPlan(true);
    setError(null);

    try {
      const newPlan = await createPlan(user.id, parseInt(id), {
        description: planForm.description,
        status: planForm.status,
        startDate: new Date(planForm.startDate),
        endDate: planForm.endDate ? new Date(planForm.endDate) : undefined,
      });
      setPlans([...plans, newPlan]);
      setShowAddPlanForm(false);
      setPlanForm({
        description: '',
        status: 'Active',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
      });
    } catch (err) {
      setError('Failed to create plan');
      console.error(err);
    } finally {
      setIsCreatingPlan(false);
    }
  };

  const handleUpdateDiagnosis = async () => {
    if (!user?.id || !id) return;

    setIsUpdatingDiagnosis(true);
    setError(null);

    try {
      await updatePatientDiagnosis(user.id, parseInt(id), diagnosisValue);
      setPatient({ ...patient!, diagnosis: diagnosisValue });
      setIsEditingDiagnosis(false);
    } catch (err) {
      setError('Failed to update diagnosis');
      console.error(err);
    } finally {
      setIsUpdatingDiagnosis(false);
    }
  };

  const handleDeleteExercise = async (planId: number, planExerciseId: number) => {
    if (!confirm('Are you sure you want to remove this exercise from the plan?')) return;

    try {
      await deleteExerciseFromPlan(planId, planExerciseId);
      await loadPatientData();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to delete exercise');
    }
  };

  const handleUpdatePlanStatus = async (planId: number, newStatus: string) => {
    try {
      await updatePlanStatus(planId, newStatus);
      await loadPatientData();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update plan status');
    }
  };

  const handleAddExercise = async (planId: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseForm.exerciseId) {
      setError('Please select an exercise');
      return;
    }

    setIsAddingExercise(true);
    setError(null);

    try {
      await addExerciseToPlan(planId, exerciseForm);
      setShowAddExerciseForm(null);
      setExerciseForm({ exerciseId: 0, durationMinutes: 30, repetition: 1, aiConstraints: '' });
      await loadPatientData();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to add exercise');
    } finally {
      setIsAddingExercise(false);
    }
  };

  const handleSaveReport = async (planId: number) => {
    if (!user?.id || !reportNotes.trim()) {
      setError('Please add notes for the report');
      return;
    }

    setIsSavingReport(true);
    try {
      if (selectedReport) {
        await updateWeeklyReport(selectedReport.id, {
          doctorId: selectedReport.doctorId,
          patientId: selectedReport.patientId,
          therapyPlanId: selectedReport.therapyPlanId,
          startDate: selectedReport.startDate,
          endDate: selectedReport.endDate,
          totalHours: selectedReport.totalHours,
          doctorNotes: reportNotes,
        });
      } else {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 7);

        await createWeeklyReport({
          doctorId: user.id,
          patientId: parseInt(id!),
          therapyPlanId: planId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          totalHours: 0,
          doctorNotes: reportNotes,
        });
      }

      const report = await getReportByPlan(planId);
      setReportsByPlan((prev) => ({
        ...prev,
        [planId]: report,
      }));

      setShowReportModal(false);
      setReportNotes('');
      setSelectedReport(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save report');
    } finally {
      setIsSavingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-gray-200 rounded mt-2 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
          </div>
          <div className="lg:col-span-2 space-y-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Patient Not Found</h3>
        <p className="text-gray-600">The requested patient could not be found</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patient Details</h1>
            <p className="mt-2 text-gray-600">Manage therapy plans and track progress for {patient.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              Patient ID: #{patient.id}
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
                onClick={loadPatientData}
                className="text-sm text-red-600 hover:text-red-800 mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Profile Card */}
        <div>
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 sticky top-6">
            <div className="text-center mb-6">
              {patient.profilePicture ? (
                <img
                  src={patient.profilePicture}
                  alt={patient.name}
                  className="h-32 w-32 rounded-2xl object-cover mx-auto ring-4 ring-gray-100"
                />
              ) : (
                <div className="h-32 w-32 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto ring-4 ring-gray-100">
                  <User className="w-16 h-16 text-gray-400" />
                </div>
              )}
              <h2 className="text-xl font-bold text-gray-900 mt-4">{patient.name}</h2>
              <p className="text-gray-600 text-sm">{patient.email}</p>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Patient Information
                </h3>
                <div className="space-y-2 text-sm">
                  {patient.age && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Age</span>
                      <span className="font-medium text-gray-900">{patient.age}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member Since</span>
                    <span className="font-medium text-gray-900">2024</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Diagnosis
                  </h3>
                  {!isEditingDiagnosis && (
                    <button
                      onClick={() => setIsEditingDiagnosis(true)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>
                {isEditingDiagnosis ? (
                  <div className="space-y-3">
                    <textarea
                      value={diagnosisValue}
                      onChange={(e) => setDiagnosisValue(e.target.value)}
                      className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                      rows={3}
                      placeholder="Enter diagnosis..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateDiagnosis}
                        disabled={isUpdatingDiagnosis}
                        className="flex-1 text-sm rounded-lg bg-gray-900 px-3 py-2 text-white font-medium hover:bg-gray-800 disabled:opacity-50"
                      >
                        {isUpdatingDiagnosis ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingDiagnosis(false);
                          setDiagnosisValue(patient.diagnosis || '');
                        }}
                        className="flex-1 text-sm rounded-lg border border-gray-300 px-3 py-2 text-gray-700 font-medium hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700">
                    {patient.diagnosis || <span className="text-gray-400">No diagnosis recorded</span>}
                  </p>
                )}
              </div>

              <div className="rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 p-4 text-white">
                <h3 className="font-medium mb-2">Quick Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Active Plans</span>
                    <span className="font-medium">
                      {plans.filter(p => p.status === 'Active').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Exercises</span>
                    <span className="font-medium">
                      {plans.reduce((acc, plan) => acc + (plan.exercises?.length || 0), 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Avg Progress</span>
                    <span className="font-medium">
                      {plans.length > 0 
                        ? `${(Object.values(planProgress).reduce((a, b) => a + b, 0) / plans.length).toFixed(1)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Plans Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Plans Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Therapy Plans</h2>
              <p className="text-gray-600 mt-1">Manage treatment plans and track patient progress</p>
            </div>
            <button
              onClick={() => setShowAddPlanForm(!showAddPlanForm)}
              className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-white font-medium hover:bg-gray-800 transition-all"
            >
              <Plus size={18} />
              New Plan
            </button>
          </div>

          {/* Add Plan Form */}
          {showAddPlanForm && (
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 animate-slide-down">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Create New Therapy Plan</h3>
              <form onSubmit={handleCreatePlan} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plan Description
                  </label>
                  <input
                    type="text"
                    value={planForm.description}
                    onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    placeholder="e.g., Post-surgery rehabilitation, Strength training..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={planForm.status}
                      onChange={(e) => setPlanForm({ ...planForm, status: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    >
                      <option value="Active">Active</option>
                      <option value="Paused">Paused</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={planForm.startDate}
                      onChange={(e) => setPlanForm({ ...planForm, startDate: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={planForm.endDate}
                      onChange={(e) => setPlanForm({ ...planForm, endDate: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isCreatingPlan}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isCreatingPlan ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating Plan...
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        Create Plan
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddPlanForm(false)}
                    className="flex-1 rounded-xl border border-gray-300 px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Plans List */}
          {plans.length === 0 ? (
            <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-gray-200">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Therapy Plans</h3>
              <p className="text-gray-600 mb-6">Start by creating your first therapy plan</p>
              <button
                onClick={() => setShowAddPlanForm(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-white font-medium hover:bg-gray-800 transition-all"
              >
                <Plus size={18} />
                Create First Plan
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="group rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {plan.description || 'Untitled Plan'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          plan.status === 'Active' ? 'bg-green-100 text-green-700' :
                          plan.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                          plan.status === 'Paused' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {plan.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(plan.startDate).toLocaleDateString()}
                        </div>
                        {plan.endDate && (
                          <div className="flex items-center gap-1">
                            <ChevronRight size={14} />
                            {new Date(plan.endDate).toLocaleDateString()}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Activity size={14} />
                          {plan.exercises?.length || 0} exercises
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <select
                        value={plan.status}
                        onChange={(e) => handleUpdatePlanStatus(plan.id, e.target.value)}
                        className="text-sm rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 font-medium hover:bg-gray-50 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                      >
                        <option value="Active">Active</option>
                        <option value="Paused">Paused</option>
                        <option value="Completed">Completed</option>
                        <option value="Ended">Ended</option>
                      </select>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {planProgress[plan.id] !== undefined && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {planProgress[plan.id].toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full bg-gradient-to-r from-gray-900 to-gray-700 rounded-full transition-all duration-500"
                          style={{ width: `${planProgress[plan.id]}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Exercises Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Exercises</h4>
                      {plan.status === 'Active' && (
                        <button
                          onClick={() => setShowAddExerciseForm(showAddExerciseForm === plan.id ? null : plan.id)}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
                        >
                          <Plus size={14} />
                          Add Exercise
                        </button>
                      )}
                    </div>

                    {showAddExerciseForm === plan.id && (
                      <form onSubmit={(e) => handleAddExercise(plan.id, e)} className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4 animate-slide-down">
                        <div className="space-y-4">
                          <select
                            value={exerciseForm.exerciseId}
                            onChange={(e) => setExerciseForm({ ...exerciseForm, exerciseId: parseInt(e.target.value) })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                            required
                          >
                            <option value={0}>Select an exercise...</option>
                            {availableExercises.map((ex) => (
                              <option key={ex.id} value={ex.id}>{ex.name}</option>
                            ))}
                          </select>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Duration (min)</label>
                              <input
                                type="number"
                                value={exerciseForm.durationMinutes}
                                onChange={(e) => setExerciseForm({ ...exerciseForm, durationMinutes: parseInt(e.target.value) || 30 })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                required
                                min={1}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Repetitions</label>
                              <input
                                type="number"
                                value={exerciseForm.repetition}
                                onChange={(e) => setExerciseForm({ ...exerciseForm, repetition: parseInt(e.target.value) || 1 })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                required
                                min={1}
                              />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={isAddingExercise}
                              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white font-medium hover:bg-gray-800 disabled:opacity-50"
                            >
                              {isAddingExercise ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Adding...
                                </>
                              ) : (
                                'Add Exercise'
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddExerciseForm(null);
                                setExerciseForm({ exerciseId: 0, durationMinutes: 30, repetition: 1, aiConstraints: '' });
                              }}
                              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 font-medium hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                    {plan.exercises && plan.exercises.length > 0 ? (
                      <div className="space-y-2">
                        {plan.exercises.map((exercise) => (
                          <div
                            key={exercise.id}
                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Activity className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <h5 className="font-medium text-gray-900">{exercise.exercise?.name || 'Exercise'}</h5>
                                <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                                  {exercise.durationMinutes && (
                                    <span>{exercise.durationMinutes} min</span>
                                  )}
                                  {exercise.repetition && (
                                    <span>×{exercise.repetition}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {plan.status === 'Active' && (
                              <button
                                onClick={() => handleDeleteExercise(plan.id, exercise.id)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete exercise"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
                        <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">No exercises added yet</p>
                      </div>
                    )}
                  </div>

                  {/* Weekly Report Section */}
                  {(plan.status === 'Completed' || plan.status === 'Paused' || plan.status === 'Ended') && (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                          <FileText size={16} />
                          Weekly Report
                        </h4>
                        <button
                          onClick={() => {
                            const report = reportsByPlan[plan.id];
                            setSelectedPlanId(plan.id);
                            setSelectedReport(report || null);
                            setReportNotes((report?.doctorNotes as string) || '');
                            setShowReportModal(true);
                          }}
                          className="flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white font-medium hover:bg-gray-800"
                        >
                          {reportsByPlan[plan.id] ? 'Edit Report' : 'Add Report'}
                        </button>
                      </div>
                      
                      {reportsByPlan[plan.id] ? (
                        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-green-900 mb-1">Report Submitted</p>
                              <p className="text-sm text-green-700 whitespace-pre-wrap">
                                {reportsByPlan[plan.id].doctorNotes}
                              </p>
                              <p className="text-xs text-green-600 mt-2">
                                Updated: {new Date(reportsByPlan[plan.id].endDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                            <p className="text-sm text-yellow-700">No weekly report added yet</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weekly Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-slide-up">
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedReport ? 'Edit Weekly Report' : 'New Weekly Report'}
                </h2>
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportNotes('');
                    setSelectedReport(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-gray-600 mt-2">Add detailed notes about patient progress and observations</p>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Doctor Notes</label>
                <textarea
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Enter detailed notes about patient progress, challenges, improvements, and recommendations..."
                  className="w-full h-48 rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 resize-none"
                />
                <div className="flex justify-end mt-2">
                  <span className="text-xs text-gray-500">
                    {reportNotes.length}/2000 characters
                  </span>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportNotes('');
                    setSelectedReport(null);
                  }}
                  className="flex-1 rounded-xl border border-gray-300 bg-white px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedPlanId) {
                      handleSaveReport(selectedPlanId);
                    }
                  }}
                  disabled={isSavingReport || !reportNotes.trim()}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSavingReport ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      {selectedReport ? 'Update Report' : 'Save Report'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}