import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  getAllDoctorsWithCommunications,
  type DoctorWithCommunications,
  type DoctorPatient,
  type DoctorWeeklyReport,
} from '../services/api/doctor.api';
import { Search, Users, Layers, ChevronDown, ChevronUp, Phone, MapPin, Star } from 'lucide-react';
import { resolveMediaUrl } from '../utils/mediaUrl';

export function DoctorsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<DoctorWithCommunications[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDoctorId, setExpandedDoctorId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getAllDoctorsWithCommunications();
        setDoctors(data);
      } catch (err: any) {
        console.error(err);
        setError('Failed to load doctors');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [user]);

  const filteredDoctors = useMemo(() => {
    if (!searchTerm) return doctors;

    const term = searchTerm.toLowerCase().trim();
    return doctors.filter((d) =>
      d.name.toLowerCase().includes(term) ||
      d.email.toLowerCase().includes(term) ||
      d.patients?.some((p) => p.name.toLowerCase().includes(term) || p.email.toLowerCase().includes(term))
    );
  }, [doctors, searchTerm]);

  const toggleExpand = (id: number) => {
    setExpandedDoctorId((prev) => (prev === id ? null : id));
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Doctors</h1>
            <p className="mt-2 text-gray-600">
              Browse doctors, their assigned patients, and communication reports.
            </p>
          </div>
          <div className="w-full sm:w-80">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search doctors or patients..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-6">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDoctors.length === 0 ? (
            <div className="rounded-xl bg-white p-6 border border-gray-200">
              <p className="text-gray-600">No doctors found.</p>
            </div>
          ) : (
            filteredDoctors.map((doctor) => {
              const isExpanded = expandedDoctorId === doctor.id;
              const yourReports: DoctorWeeklyReport[] = (doctor.weeklyReports ?? []).filter(
                (report) => report.patientId === (user?.id ?? 0)
              );
              const isSelf = user && user.role === 'doctor' && user.id === doctor.id;

              return (
                <div
                  key={doctor.id}
                  className="rounded-xl bg-white border border-gray-200 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(doctor.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4"
                  >
                    <div
                      role="presentation"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/doctors/${doctor.id}`);
                      }}
                      className="flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                          <Users className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-semibold text-blue-600 hover:text-blue-700">{doctor.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500">{doctor.email}</span>
                            {doctor.averageRating && doctor.averageRating > 0 ? (
                              <>
                                <span className="text-gray-300">•</span>
                                <div className="flex items-center gap-0.5">
                                  <Star size={12} className="fill-amber-400 text-amber-400" />
                                  <span className="text-xs font-semibold text-amber-600">
                                    {doctor.averageRating.toFixed(1)}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-xs text-gray-400">No reviews</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Patients</p>
                        <p className="font-semibold text-gray-900">{doctor.patients?.length ?? 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Reports</p>
                        <p className="font-semibold text-gray-900">{doctor.weeklyReports?.length ?? 0}</p>
                      </div>
                      <span className="text-gray-500">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-200 px-6 py-4">
                      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {doctor.phoneNumber && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Phone size={16} className="text-gray-500" />
                            <span>{doctor.phoneNumber}</span>
                          </div>
                        )}
                        {doctor.address && (
                          <div className="flex items-start gap-2 text-gray-700">
                            <MapPin size={16} className="text-gray-500 mt-0.5" />
                            <span>{doctor.address}</span>
                          </div>
                        )}
                        {doctor.cvText && (
                          <div className="md:col-span-2 p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium text-gray-900 mb-1">CV Summary</p>
                            <p className="text-gray-600 whitespace-pre-wrap">{doctor.cvText}</p>
                          </div>
                        )}
                        {doctor.cv && (
                          <div>
                            <a
                              href={resolveMediaUrl(doctor.cv)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 underline"
                            >
                              View CV File
                            </a>
                          </div>
                        )}
                        {doctor.communicationInfo && (
                          <div className="md:col-span-2 p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium text-gray-900 mb-1">Communication Info</p>
                            <p className="text-gray-600 whitespace-pre-wrap">{doctor.communicationInfo}</p>
                          </div>
                        )}
                      </div>
                      {isSelf && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Layers className="w-4 h-4 text-gray-500" />
                              <h4 className="text-sm font-semibold text-gray-900">Patients</h4>
                            </div>
                            {doctor.patients && doctor.patients.length > 0 ? (
                              <ul className="space-y-2">
                                {doctor.patients.map((patient: DoctorPatient) => (
                                  <li
                                    key={patient.id}
                                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                                  >
                                    <div>
                                      <p className="font-medium text-gray-900">{patient.name}</p>
                                      <p className="text-xs text-gray-500">{patient.email}</p>
                                    </div>
                                    <span className="text-xs text-gray-500">Age: {patient.age ?? '—'}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500">No patients assigned yet.</p>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Layers className="w-4 h-4 text-gray-500" />
                              <h4 className="text-sm font-semibold text-gray-900">Communication Reports</h4>
                            </div>
                            {doctor.weeklyReports && doctor.weeklyReports.length > 0 ? (
                              <div className="space-y-2">
                                {doctor.weeklyReports.slice(0, 5).map((report) => (
                                  <div
                                    key={report.id}
                                    className="rounded-lg border border-gray-100 p-3"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <p className="text-xs text-gray-500">{report.patientName ?? 'Patient'}</p>
                                        <p className="font-medium text-gray-900">
                                          {formatDate(report.startDate)} - {formatDate(report.endDate)}
                                        </p>
                                      </div>
                                      <span className="text-xs text-gray-500">{report.totalHours}h</span>
                                    </div>
                                    {report.aiSummary ? (
                                      <p className="mt-2 text-sm text-gray-600">{report.aiSummary}</p>
                                    ) : (
                                      <p className="mt-2 text-sm text-gray-500">No summary available.</p>
                                    )}
                                  </div>
                                ))}
                                {doctor.weeklyReports.length > 5 && (
                                  <p className="text-xs text-gray-500">Showing latest 5 reports.</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No communication reports available.</p>
                            )}
                          </div>
                        </div>
                      )}

                      {yourReports.length > 0 && (
                        <div className="mt-6 rounded-lg bg-blue-50 p-4">
                          <h4 className="text-sm font-semibold text-blue-900">Your reports with {doctor.name}</h4>
                          <ul className="mt-2 space-y-2">
                            {yourReports.map((report) => (
                              <li key={report.id} className="text-sm text-blue-800">
                                <span className="font-medium">{formatDate(report.startDate)}</span> – {report.aiSummary ?? report.doctorNotes ?? 'No notes'}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
