import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getAllDoctorsWithCommunications, type DoctorWithCommunications } from '../../services/api/doctor.api';
import { getPatientProfile } from '../../services/api/patient.api';
import { requestTransfer, getPatientTransferRequests, cancelTransferRequest } from '../../services/api/transfer.api';
import type { TransferRequest } from '../../services/api/transfer.api';
import { Search, Send, X, Star, Eye } from 'lucide-react';

export function PatientFindDoctorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<DoctorWithCommunications[]>([]);
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [hasDoctor, setHasDoctor] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRequests, setShowRequests] = useState(false);

  useEffect(() => {
    if (user?.role === 'patient' && user.id) load();
  }, [user]);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [profile, docs, reqs] = await Promise.all([
        getPatientProfile(user.id),
        getAllDoctorsWithCommunications(),
        getPatientTransferRequests(user.id),
      ]);
      setHasDoctor(!!profile.doctorId);
      setDoctors(docs);
      setRequests(reqs);
    } catch {
      setError('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return doctors;
    return doctors.filter((d) => (d.name ?? '').toLowerCase().includes(term) || (d.email ?? '').toLowerCase().includes(term));
  }, [doctors, search]);

  const handleRequest = async (doctorId: number) => {
    if (!user?.id || hasDoctor) return;
    setSubmitting(true);
    setError(null);
    try {
      await requestTransfer(user.id, doctorId, message || undefined);
      setSelectedDoctorId(null);
      setMessage('');
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingFor = (doctorId: number) => requests.find((r) => r.toDoctorId === doctorId && r.status === 'Pending');

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Browse Doctors</h1>
        <p className="mt-2 text-gray-600">View doctor profiles, ratings, and reviews. Request transfer when you have no assigned doctor.</p>
      </div>


      {error && <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">{error}</div>}

      {requests.length > 0 && (
        <div className="rounded-xl bg-white border border-gray-200">
          <button
            type="button"
            onClick={() => setShowRequests(!showRequests)}
            className="w-full flex items-center justify-between p-6 text-left"
          >
            <div>
              <h2 className="font-semibold text-gray-900">
                Request History
              </h2>
              <p className="text-sm text-gray-500">
                {requests.length} request{requests.length !== 1 ? 's' : ''}
              </p>
            </div>

            <span className="text-sm text-blue-600 font-medium">
              {showRequests ? 'Hide' : 'View'}
            </span>
          </button>

          {showRequests && (
            <div className="px-6 pb-6 border-t border-gray-100">
              <div className="space-y-2 pt-4">
                {requests.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
                  >
                    <div>
                      <span className="font-medium">
                        {r.toDoctorName}
                      </span>
                      <span className="text-gray-500 ml-2">
                        {r.status}
                      </span>
                    </div>

                    {r.status === 'Pending' && (
                      <button
                        onClick={() =>
                          user?.id &&
                          cancelTransferRequest(user.id, r.id).then(load)
                        }
                        className="text-red-600 hover:text-red-700 flex items-center gap-1"
                      >
                        <X size={14} />
                        Cancel
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email" className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300" />
      </div>

      {loading ? (
        <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
      ) : (
        <div className="space-y-3">
          {filtered.map((doc) => {
            const pending = pendingFor(doc.id);
            return (
              <div key={doc.id} className="rounded-xl bg-white border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => navigate(`/patient/doctor/${doc.id}/profile`)}
                  className="text-left flex-1 hover:opacity-80 transition-opacity"
                >
                  <p className="font-semibold text-gray-900">{doc.name}</p>
                  <p className="text-sm text-gray-500">{doc.email}</p>
                  {doc.averageRating != null && (
                    <p className="text-sm text-yellow-600 flex items-center gap-1 mt-1"><Star size={14} /> {doc.averageRating.toFixed(1)}</p>
                  )}
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/patient/doctor/${doc.id}/profile`)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Eye size={14} /> View Profile
                  </button>
                  {hasDoctor ? (
                    <span className="text-sm text-gray-500 px-2"> </span>
                  ) : pending ? (
                    <span className="text-sm text-amber-700 font-medium px-2">Pending</span>
                  ) : selectedDoctorId === doc.id ? (
                    <div className="flex flex-col gap-2 min-w-[220px]">
                      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Optional message" rows={2} className="text-sm border rounded-lg px-3 py-2" />
                      <div className="flex gap-2">
                        <button disabled={submitting} onClick={() => handleRequest(doc.id)} className="flex-1 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm">Send</button>
                        <button onClick={() => setSelectedDoctorId(null)} className="px-3 py-2 border rounded-lg text-sm">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setSelectedDoctorId(doc.id)} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm">
                      <Send size={14} /> Request
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
