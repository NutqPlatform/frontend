import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getPatientDetails, getPatientPlans, createPlan, updatePatientDiagnosis, deleteExerciseFromPlan, updatePlanStatus, getPlanProgress } from '../../services/api/patients.api';
import { getAllExercises, addExerciseToPlan } from '../../services/api/exercises.api';
import { createWeeklyReport, updateWeeklyReport, getReportByPlan } from '../../services/api/weeklyReport.api';
import type { PatientDetails, TherapyPlan } from '../../services/api/patients.api';
import type { Exercise, AddExerciseToPlanRequest } from '../../services/api/exercises.api';

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
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
      
      // Load patient details first
      const patientData = await getPatientDetails(user.id, patientId);
      setPatient(patientData);
      setDiagnosisValue(patientData.diagnosis || '');
      
      // Try to load plans, but don't fail if it errors
      try {
        const [plansData, exercisesData] = await Promise.all([
          getPatientPlans(user.id, patientId),
          getAllExercises(),
        ]);
        setPlans(plansData);
        setAvailableExercises(exercisesData);
        
        // Load progress for each plan
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

        // Load reports for each plan
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
        // Set empty plans array if loading fails
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
        // Update existing report
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
        // Create new report
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

      // Reload reports for this plan
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
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">Loading patient details...</div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">Patient not found</div>
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
            <h1 className="text-3xl font-semibold tracking-tight">Patient Details</h1>
            <p className="mt-1 text-sm text-slate-600">{patient.name}</p>
          </div>
          <button
            onClick={() => navigate('/doctor/patients')}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Back to Patients
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Patient Info Card */}
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-4 text-xl font-semibold">Patient Information</h2>
            <div className="mb-6 flex justify-center">
              {patient.profilePicture ? (
                <img
                  src={patient.profilePicture}
                  alt={patient.name}
                  className="h-32 w-32 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-slate-100 text-4xl">
                  👤
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-slate-600">Name</div>
                <div className="text-base text-slate-900">{patient.name}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-600">Email</div>
                <div className="text-base text-slate-900">{patient.email}</div>
              </div>
              {patient.age && (
                <div>
                  <div className="text-sm font-medium text-slate-600">Age</div>
                  <div className="text-base text-slate-900">{patient.age}</div>
                </div>
              )}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-600">Diagnosis</div>
                  {!isEditingDiagnosis && (
                    <button
                      onClick={() => setIsEditingDiagnosis(true)}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {isEditingDiagnosis ? (
                  <div className="space-y-2">
                    <textarea
                      value={diagnosisValue}
                      onChange={(e) => setDiagnosisValue(e.target.value)}
                      className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      rows={3}
                      placeholder="Enter diagnosis..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateDiagnosis}
                        disabled={isUpdatingDiagnosis}
                        className="rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                      >
                        {isUpdatingDiagnosis ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingDiagnosis(false);
                          setDiagnosisValue(patient.diagnosis || '');
                        }}
                        className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-base text-slate-900">
                    {patient.diagnosis || <span className="text-slate-400">No diagnosis recorded</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Plans Card */}
          <div className="lg:col-span-2 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Therapy Plans</h2>
              <button
                onClick={() => setShowAddPlanForm(!showAddPlanForm)}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
              >
                {showAddPlanForm ? 'Cancel' : '+ Add New Plan'}
              </button>
            </div>

            {showAddPlanForm && (
              <form onSubmit={handleCreatePlan} className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Description
                    </label>
                    <input
                      type="text"
                      value={planForm.description}
                      onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Status</label>
                    <select
                      value={planForm.status}
                      onChange={(e) => setPlanForm({ ...planForm, status: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Paused">Paused</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={planForm.startDate}
                        onChange={(e) => setPlanForm({ ...planForm, startDate: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={planForm.endDate}
                        onChange={(e) => setPlanForm({ ...planForm, endDate: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isCreatingPlan}
                    className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {isCreatingPlan ? 'Creating...' : 'Create Plan'}
                  </button>
                </div>
              </form>
            )}

            {plans.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-600">
                No therapy plans yet. Add your first plan above.
              </div>
            ) : (
              <div className="space-y-4">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{plan.description || 'Untitled Plan'}</h3>
                        <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                          <div>Start: {new Date(plan.startDate).toLocaleDateString()}</div>
                          {plan.endDate && (
                            <div>End: {new Date(plan.endDate).toLocaleDateString()}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={plan.status}
                          onChange={(e) => handleUpdatePlanStatus(plan.id, e.target.value)}
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700"
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
                      <div className="mb-3">
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-slate-600">Progress</span>
                          <span className="font-medium text-slate-700">{planProgress[plan.id].toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${planProgress[plan.id]}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Exercises List */}
                    <div className="mb-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">
                          Exercises ({plan.exercises?.length || 0})
                        </span>
                        {plan.status === 'Active' && (
                          <button
                            onClick={() => setShowAddExerciseForm(showAddExerciseForm === plan.id ? null : plan.id)}
                            className="text-xs text-slate-600 hover:text-slate-900"
                          >
                            + Add Exercise
                          </button>
                        )}
                      </div>

                      {showAddExerciseForm === plan.id && (
                        <form onSubmit={(e) => handleAddExercise(plan.id, e)} className="mb-3 rounded border border-slate-200 bg-slate-50 p-3">
                          <div className="space-y-2">
                            <select
                              value={exerciseForm.exerciseId}
                              onChange={(e) => setExerciseForm({ ...exerciseForm, exerciseId: parseInt(e.target.value) })}
                              className="block w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                              required
                            >
                              <option value={0}>Select Exercise</option>
                              {availableExercises.map((ex) => (
                                <option key={ex.id} value={ex.id}>{ex.name}</option>
                              ))}
                            </select>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="number"
                                placeholder="Duration (min)"
                                value={exerciseForm.durationMinutes}
                                onChange={(e) => setExerciseForm({ ...exerciseForm, durationMinutes: parseInt(e.target.value) || 30 })}
                                className="block w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                                required
                                min={1}
                              />
                              <input
                                type="number"
                                placeholder="Repetitions"
                                value={exerciseForm.repetition}
                                onChange={(e) => setExerciseForm({ ...exerciseForm, repetition: parseInt(e.target.value) || 1 })}
                                className="block w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                                required
                                min={1}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={isAddingExercise}
                                className="flex-1 rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:bg-slate-400"
                              >
                                {isAddingExercise ? 'Adding...' : 'Add'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAddExerciseForm(null);
                                  setExerciseForm({ exerciseId: 0, durationMinutes: 30, repetition: 1, aiConstraints: '' });
                                }}
                                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </form>
                      )}

                      {plan.exercises && plan.exercises.length > 0 ? (
                        <div className="space-y-1">
                          {plan.exercises.map((exercise) => (
                            <div
                              key={exercise.id}
                              className="flex items-center justify-between rounded border border-slate-200 bg-white p-2 text-xs"
                            >
                              <div>
                                <span className="font-medium text-slate-900">{exercise.exercise?.name || 'Exercise'}</span>
                                {exercise.durationMinutes && (
                                  <span className="ml-2 text-slate-600">{exercise.durationMinutes} min</span>
                                )}
                                {exercise.repetition && (
                                  <span className="ml-2 text-slate-600">{exercise.repetition}x</span>
                                )}
                              </div>
                              {plan.status === 'Active' && (
                                <button
                                  onClick={() => handleDeleteExercise(plan.id, exercise.id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete exercise"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400">No exercises added yet</div>
                      )}
                    </div>

                    {/* Weekly Report Section */}
                    {plan.status && ['Completed', 'Paused', 'Ended'].includes(plan.status) && (
                      <div className="mt-4 border-t border-slate-200 pt-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">Weekly Report</span>
                          <button
                            onClick={() => {
                              const report = reportsByPlan[plan.id];
                              setSelectedPlanId(plan.id);
                              setSelectedReport(report || null);
                              const notes = (report?.doctorNotes as string) || '';
                              setReportNotes(notes);
                              setShowReportModal(true);
                            }}
                            className="rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-800"
                          >
                            {reportsByPlan[plan.id] ? 'Edit Report' : 'Add Report'}
                          </button>
                        </div>
                        {reportsByPlan[plan.id] ? (
                          <div className="rounded border border-green-200 bg-green-50 p-3 text-xs">
                            <p className="font-medium text-green-900 mb-1">Report Added</p>
                            <p className="text-green-700 whitespace-pre-wrap break-words">{reportsByPlan[plan.id].doctorNotes}</p>
                            <p className="text-green-600 text-xs mt-2">
                              Last updated: {new Date(reportsByPlan[plan.id].endDate).toLocaleDateString()}
                            </p>
                          </div>
                        ) : (
                          <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-700">
                            No report added yet. Click "Add Report" to create one.
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
      </div>

      {/* Weekly Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="border-b border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900">
                {selectedReport ? 'Edit Weekly Report' : 'Add Weekly Report'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Doctor Notes</label>
                <textarea
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Enter doctor notes for this week..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                  rows={4}
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportNotes('');
                    setSelectedReport(null);
                    setSelectedPlanId(null);
                  }}
                  className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedPlanId) {
                      handleSaveReport(selectedPlanId);
                    }
                  }}
                  disabled={isSavingReport}
                  className="flex-1 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:bg-slate-400"
                >
                  {isSavingReport ? 'Saving...' : 'Save Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
