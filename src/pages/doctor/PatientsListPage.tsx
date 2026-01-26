import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getDoctorPatients } from '../../services/api/dashboard.api';
import type { Patient } from '../../services/api/dashboard.api';

export function PatientsListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id && user?.role === 'doctor') {
      loadPatients();
    }
  }, [user]);

  const loadPatients = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const patientsData = await getDoctorPatients(user.id);
      setPatients(patientsData);
    } catch (err) {
      setError('Failed to load patients');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">Loading patients...</div>
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
            <h1 className="text-3xl font-semibold tracking-tight">Patients</h1>
            <p className="mt-1 text-sm text-slate-600">Manage your patients</p>
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

        {/* Generate Invitation Code Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => navigate('/doctor/patients/invitation-code')}
            className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
          >
            <span>🔗</span>
            <span>Generate Invitation Code</span>
          </button>
        </div>

        {/* Patients List */}
        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
          {patients.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-600">No patients yet.</p>
              <p className="mt-2 text-sm text-slate-500">
                Generate an invitation code to add your first patient.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {patients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                  className="group rounded-lg border border-slate-200 bg-white p-6 text-left transition-all hover:border-slate-300 hover:shadow-md"
                >
                  <div className="mb-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
                      👤
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{patient.name}</h3>
                      <p className="text-sm text-slate-600">{patient.email}</p>
                    </div>
                  </div>
                  {patient.age && (
                    <div className="text-sm text-slate-500">Age: {patient.age}</div>
                  )}
                  <div className="mt-4 text-sm text-slate-400 group-hover:text-slate-600">
                    Click to view details →
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
