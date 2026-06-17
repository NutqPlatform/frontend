import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSingleDoctor, type DoctorWithCommunications } from '../services/api/doctor.api';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { ArrowLeft, Users, FileText, Mail, Stethoscope, Phone, MapPin } from 'lucide-react';

export function DoctorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<DoctorWithCommunications | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const doctorId = parseInt(id, 10);
        const data = await getSingleDoctor(doctorId);
        setDoctor(data);
      } catch (err: any) {
        console.error(err);
        setError('Failed to load doctor information');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="animate-fade-in">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <div className="rounded-xl bg-red-50 border border-red-200 p-6">
          <p className="text-red-700 font-medium">{error || 'Doctor not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* Header Section */}
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-8">
          <div className="flex items-start gap-6">
            {doctor.profilePicture ? (
              <img
                src={resolveMediaUrl(doctor.profilePicture)}
                alt={doctor.name}
                className="w-24 h-24 rounded-xl object-cover flex-shrink-0 ring-4 ring-blue-50"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                <Stethoscope className="w-12 h-12" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{doctor.name}</h1>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-gray-500" />
                  <span className="text-gray-700">{doctor.email}</span>
                </div>
                {doctor.phoneNumber && (
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-gray-500" />
                    <span className="text-gray-700">{doctor.phoneNumber}</span>
                  </div>
                )}
                {doctor.address && (
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-gray-500 mt-0.5" />
                    <span className="text-gray-700">{doctor.address}</span>
                  </div>
                )}
                {doctor.age != null && (
                  <div className="text-sm text-gray-600">Age: {doctor.age}</div>
                )}
                {doctor.communicationInfo && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Communication Info</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{doctor.communicationInfo}</p>
                  </div>
                )}
                {doctor.cvText && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">CV Summary</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{doctor.cvText}</p>
                  </div>
                )}
                {doctor.cv && (
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-gray-500" />
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
              </div>
            </div>
          </div>
        </div>

        {/* Patients Section */}
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Patients ({doctor.patients?.length ?? 0})</h2>
          </div>
          {doctor.patients && doctor.patients.length > 0 ? (
            <div className="space-y-3">
              {doctor.patients.map((patient) => (
                <div
                  key={patient.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                      <Users size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{patient.name}</p>
                      <p className="text-sm text-gray-600">{patient.email}</p>
                      {patient.age && <p className="text-sm text-gray-600">Age: {patient.age}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No patients assigned yet.</p>
          )}
        </div>

        {/* Weekly Reports Section */}
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Weekly Reports ({doctor.weeklyReports?.length ?? 0})</h2>
          </div>
          {doctor.weeklyReports && doctor.weeklyReports.length > 0 ? (
            <div className="space-y-3">
              {doctor.weeklyReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Patient</p>
                      <p className="text-gray-900">{report.patientName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Period</p>
                      <p className="text-gray-900">
                        {formatDate(report.startDate)} - {formatDate(report.endDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Total Hours</p>
                      <p className="text-gray-900">{report.totalHours} hours</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Status</p>
                      <p className="text-green-600 font-medium">Completed</p>
                    </div>
                  </div>
                  {report.doctorNotes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-semibold text-gray-600">Doctor Notes</p>
                      <p className="text-gray-700">{report.doctorNotes}</p>
                    </div>
                  )}
                  {report.aiSummary && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-semibold text-gray-600">AI Summary</p>
                      <p className="text-gray-700">{report.aiSummary}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No weekly reports available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
