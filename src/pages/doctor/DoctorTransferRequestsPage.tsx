import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getDoctorTransferRequests, acceptTransferRequest, rejectTransferRequest } from '../../services/api/transfer.api';
import type { TransferRequest } from '../../services/api/transfer.api';
import { UserCheck, UserX, Clock } from 'lucide-react';

export function DoctorTransferRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.role === 'doctor' && user.id) load();
  }, [user]);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      setRequests(await getDoctorTransferRequests(user.id));
    } catch {
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: number) => {
    if (!user?.id) return;
    setActingId(id);
    try {
      await acceptTransferRequest(user.id, id);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Accept failed');
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!user?.id) return;
    setActingId(id);
    try {
      await rejectTransferRequest(user.id, id);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Reject failed');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transfer Requests</h1>
        <p className="mt-2 text-gray-600">Accept or reject incoming patient transfer requests</p>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">{error}</div>}

      {loading ? (
        <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
      ) : requests.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 p-12 text-center text-gray-600">No pending requests</div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="rounded-xl bg-white border border-gray-200 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{r.patientName}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><Clock size={14} /> {new Date(r.createdAt).toLocaleDateString()}</p>
                  {r.fromDoctorName && (
                    <p className="text-sm text-gray-600 mt-2">Previous doctor: <strong>{r.fromDoctorName}</strong></p>
                  )}
                  {r.message && <p className="text-sm text-gray-700 mt-2 p-3 bg-gray-50 rounded-lg">{r.message}</p>}
                </div>
                <div className="flex gap-2">
                  <button disabled={actingId === r.id} onClick={() => handleAccept(r.id)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                    <UserCheck size={16} /> Accept
                  </button>
                  <button disabled={actingId === r.id} onClick={() => handleReject(r.id)} className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50">
                    <UserX size={16} /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
