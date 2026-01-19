import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
    getDoctorAnalytics,
    getDoctorPatients,
    generatePatientCode,
  } from '../services/api/dashboard.api';
  
  import type { DoctorAnalyticsDto, Patient } from '../services/api/dashboard.api';
  
export function DoctorDashboard() {
  const { user, logout } = useAuth();
  const [analytics, setAnalytics] = useState<DoctorAnalyticsDto | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id && user?.role === 'doctor') {
      loadDashboard();
    }
  }, [user]);

  const loadDashboard = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const [analyticsData, patientsData] = await Promise.all([
        getDoctorAnalytics(user.id),
        getDoctorPatients(user.id),
      ]);

      setAnalytics(analyticsData);
      setPatients(patientsData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!user?.id) return;

    setIsGeneratingCode(true);
    setError(null);
    setGeneratedCode(null);

    try {
      const code = await generatePatientCode(user.id);
      setGeneratedCode(code);
    } catch (err) {
      setError('Failed to generate patient code');
      console.error(err);
    } finally {
      setIsGeneratingCode(false);
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
            <h1 className="text-3xl font-semibold tracking-tight">Doctor Dashboard</h1>
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

        {/* Analytics Cards */}
        {analytics && (
          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
            </div>
          </div>
        )}

        {/* Generate Patient Code Section */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-xl font-semibold">Generate Patient Invitation Code</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={handleGenerateCode}
              disabled={isGeneratingCode}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isGeneratingCode ? 'Generating...' : 'Generate Code'}
            </button>

            {generatedCode && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Code:</span>
                <code className="rounded-md bg-slate-100 px-3 py-1 text-sm font-mono font-semibold text-slate-900">
                  {generatedCode}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCode);
                  }}
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  Copy
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Patients List */}
        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-xl font-semibold">Your Patients</h2>

          {patients.length === 0 ? (
            <p className="text-sm text-slate-600">No patients yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-700">
                      Age
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {patients.map((patient) => (
                    <tr key={patient.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                        {patient.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {patient.email}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {patient.age ?? 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
