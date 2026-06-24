import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getReportsForPatient, type WeeklyReportDto } from '../../services/api/weeklyReport.api';
import { Calendar, FileText, TrendingUp, Download, Eye, ChevronRight, AlertCircle } from 'lucide-react';

export function PatientReportsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<WeeklyReportDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<WeeklyReportDto | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<string>('all');

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

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    if (filter === 'recent') {
      const reportDate = new Date(report.endDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return reportDate >= thirtyDaysAgo;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-gray-200 rounded mt-2 animate-pulse" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse" />
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
            <h1 className="text-3xl font-bold text-gray-900">Weekly Reports</h1>
            <p className="mt-2 text-gray-600">View your therapy progress reports from your physician</p>
          </div>
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              {reports.length} report{reports.length !== 1 ? 's' : ''}
            </span>
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
                onClick={loadReports}
                className="text-sm text-red-600 hover:text-red-800 mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats & Filters */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Total Reports</div>
          <div className="text-2xl font-bold text-gray-900">{reports.length}</div>
        </div>
        <div className="rounded-xl bg-white p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">This Month</div>
          <div className="text-2xl font-bold text-gray-900">
            {reports.filter(r => {
              const reportDate = new Date(r.endDate);
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              return reportDate >= thirtyDaysAgo;
            }).length}
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Avg. Hours</div>
          <div className="text-2xl font-bold text-gray-900">
            {(reports.reduce((acc, r) => acc + r.totalHours, 0) / (reports.length || 1)).toFixed(1)}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'all'
            ? 'bg-gray-900 text-white'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
        >
          All Reports
        </button>
        <button
          onClick={() => setFilter('recent')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'recent'
            ? 'bg-gray-900 text-white'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
        >
          Last 30 Days
        </button>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-gray-200">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === 'recent' ? 'No Recent Reports' : 'No Reports Yet'}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {filter === 'recent'
              ? 'You don\'t have any reports from the last 30 days. Check back soon!'
              : 'Your physician will share progress reports here as you continue your therapy.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="group rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                      <FileText size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Weekly Progress Report
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
                        </span>
                        {report.totalHours > 0 && (
                          <span className="flex items-center gap-1">
                            <TrendingUp size={14} />
                            {report.totalHours} hours
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {report.doctorNotes && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Physician Notes:</p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {report.doctorNotes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedReport(report);
                      setShowModal(true);
                    }}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all flex items-center gap-2"
                  >
                    <Eye size={16} />
                    View Details
                  </button>
                  <button
                    onClick={() => {
                      alert('Download feature coming soon!');
                    }}
                    className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                    title="Download report"
                  >
                    <Download size={18} />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedReport(report);
                    setShowModal(true);
                  }}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  Read full report
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Details Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl animate-in fade-in duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Weekly Report Details</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(selectedReport.startDate).toLocaleDateString()} - {new Date(selectedReport.endDate).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Report Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-gray-50 p-4">
                    <div className="text-sm text-gray-600 mb-1">Reporting Period</div>
                    <div className="font-medium text-gray-900">
                      {new Date(selectedReport.startDate).toLocaleDateString()} - {new Date(selectedReport.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Hours</div>
                    <div className="font-medium text-gray-900">{selectedReport.totalHours} hours</div>
                  </div>
                </div>

                {/* Doctor Notes */}
                {selectedReport.doctorNotes && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-lg bg-gray-100">
                        <FileText size={18} className="text-gray-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">Physician Notes</h4>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {selectedReport.doctorNotes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Additional Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Report Information</h4>
                  <div className="space-y-2 text-sm">

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Generated:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(selectedReport.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                        Completed
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    alert('Download feature coming soon!');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all"
                >
                  <Download size={18} />
                  Download PDF
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-all"
                >
                  Close Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      {reports.length > 0 && (
        <div className="mt-8 rounded-xl bg-gray-50 border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <span className="text-yellow-600">💡</span>
            </div>
            <h3 className="font-semibold text-gray-900">Understanding Your Reports</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 mt-0.5">•</span>
              <span>Reports are generated weekly by your physician</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 mt-0.5">•</span>
              <span>Review notes for feedback on your progress</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 mt-0.5">•</span>
              <span>Track hours spent on therapy exercises</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 mt-0.5">•</span>
              <span>Discuss any questions with your physician</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}