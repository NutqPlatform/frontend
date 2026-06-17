import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import adminAPI from '../../services/api/admin.api';
import type { DoctorManagementDto, PatientManagementDto } from '../../services/api/admin.api';

export default function AdminDashboard() {
  const [doctors, setDoctors] = useState<DoctorManagementDto[]>([]);
  const [patients, setPatients] = useState<PatientManagementDto[]>([]);
  const [tab, setTab] = useState<'doctors' | 'patients' | 'generate'>('doctors');
  const [generateCount, setGenerateCount] = useState(1);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }

    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [doctorsData, patientsData] = await Promise.all([
        adminAPI.getAllDoctors(),
        adminAPI.getAllPatients(),
      ]);
      setDoctors(doctorsData);
      setPatients(patientsData);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockDoctor = async (doctorId: number) => {
    try {
      await adminAPI.blockDoctor(doctorId);
      setDoctors(doctors.map(d => (d.id === doctorId ? { ...d, isBlocked: true } : d)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to block doctor');
    }
  };

  const handleUnblockDoctor = async (doctorId: number) => {
    try {
      await adminAPI.unblockDoctor(doctorId);
      setDoctors(doctors.map(d => (d.id === doctorId ? { ...d, isBlocked: false } : d)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unblock doctor');
    }
  };

  const handleBlockPatient = async (patientId: number) => {
    try {
      await adminAPI.blockPatient(patientId);
      setPatients(patients.map(p => (p.id === patientId ? { ...p, isBlocked: true } : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to block patient');
    }
  };

  const handleUnblockPatient = async (patientId: number) => {
    try {
      await adminAPI.unblockPatient(patientId);
      setPatients(patients.map(p => (p.id === patientId ? { ...p, isBlocked: false } : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unblock patient');
    }
  };

  const handleGenerateCodes = async () => {
    try {
      const result = await adminAPI.generateCodes({
        adminId: user?.id || 0,
        count: generateCount,
      });
      setGeneratedCodes(result.codes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate codes');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-4 border-b">
          <button
            onClick={() => setTab('doctors')}
            className={`pb-2 px-4 font-medium ${
              tab === 'doctors'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Manage Doctors
          </button>
          <button
            onClick={() => setTab('patients')}
            className={`pb-2 px-4 font-medium ${
              tab === 'patients'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Manage Patients
          </button>
          <button
            onClick={() => setTab('generate')}
            className={`pb-2 px-4 font-medium ${
              tab === 'generate'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Generate Invitation Codes
          </button>
        </div>

        {loading && <div className="text-center py-8 text-gray-600">Loading...</div>}

        {/* Doctors Tab */}
        {tab === 'doctors' && !loading && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Rating</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor) => (
                  <tr key={doctor.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900">{doctor.name}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{doctor.email}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{doctor.phoneNumber || '-'}</td>
                    <td className="px-6 py-3 text-sm text-gray-900">
                      <span className="flex items-center gap-1">
                        {'⭐'.repeat(Math.floor(doctor.averageRating))}
                        {doctor.averageRating.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          doctor.isBlocked
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {doctor.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {doctor.isBlocked ? (
                        <button
                          onClick={() => handleUnblockDoctor(doctor.id)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlockDoctor(doctor.id)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Block
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Patients Tab */}
        {tab === 'patients' && !loading && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Doctor ID</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900">{patient.name}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{patient.email}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{patient.phoneNumber || '-'}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{patient.doctorId}</td>
                    <td className="px-6 py-3 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          patient.isBlocked
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {patient.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {patient.isBlocked ? (
                        <button
                          onClick={() => handleUnblockPatient(patient.id)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlockPatient(patient.id)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Block
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Generate Codes Tab */}
        {tab === 'generate' && !loading && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Generate Invitation Codes</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="count" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Codes
                </label>
                <input
                  type="number"
                  id="count"
                  min="1"
                  max="100"
                  value={generateCount}
                  onChange={(e) => setGenerateCount(parseInt(e.target.value))}
                  className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={handleGenerateCodes}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Generate Codes
              </button>

              {generatedCodes.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Generated Codes:</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {generatedCodes.map((code, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded"
                      >
                        <code className="font-mono text-lg font-semibold">{code}</code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(code);
                            alert('Code copied!');
                          }}
                          className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
                        >
                          Copy
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
