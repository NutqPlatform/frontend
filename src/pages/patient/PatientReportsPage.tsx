import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getReportsForPatient, type WeeklyReportDto } from '../../services/api/weeklyReport.api';

export function PatientReportsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<WeeklyReportDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<WeeklyReportDto | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user?.role && user.role !== 'patient') {
      navigate('/dashboard');
      return;
    }
    if (user?.id && user?.role === 'patient') {
      loadReports();
    }
  }, [user, navigate]);

  const loadReports = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getReportsForPatient(user.id);
      setReports(data);
    } catch (err) {
      setError('Failed to load reports');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Weekly Reports</h1>
          <button
            onClick={() => navigate('/dashboard')}
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

        {reports.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">No weekly reports yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200 hover:ring-slate-300"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Weekly Report
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedReport(report);
                      setShowModal(true);
                    }}
                    className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    View Details
                  </button>
                </div>

                {report.doctorNotes && (
                  <div className="text-sm text-slate-600">
                    <p className="font-medium text-slate-700 mb-2">Doctor Notes:</p>
                    <p className="text-slate-600">{report.doctorNotes.substring(0, 100)}...</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Details Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Weekly Report Details</h3>

            <div className="space-y-4 mb-6">
              <div>
                <span className="text-sm font-medium text-slate-600">Period:</span>
                <p className="text-slate-900">
                  {new Date(selectedReport.startDate).toLocaleDateString()} - {new Date(selectedReport.endDate).toLocaleDateString()}
                </p>
              </div>

              {selectedReport.doctorNotes && (
                <div>
                  <span className="text-sm font-medium text-slate-600">Doctor Notes:</span>
                  <div className="mt-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-900">
                    {selectedReport.doctorNotes}
                  </div>
                </div>
              )}

              {selectedReport.totalHours > 0 && (
                <div>
                  <span className="text-sm font-medium text-slate-600">Total Hours:</span>
                  <p className="text-slate-900">{selectedReport.totalHours} hours</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
