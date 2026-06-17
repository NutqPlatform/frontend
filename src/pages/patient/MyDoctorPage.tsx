import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getAttendingDoctor } from '../../services/api/patient.api';
import { Stethoscope, AlertCircle } from 'lucide-react';

export function MyDoctorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || user.role !== 'patient') {
      navigate('/dashboard');
      return;
    }

    const load = async () => {
      try {
        const doctor = await getAttendingDoctor(user.id);
        if (doctor?.id) {
          navigate(`/patient/doctor/${doctor.id}/profile`, { replace: true });
        } else {
          setError('No attending physician assigned to your account.');
        }
      } catch {
        setError('Failed to load your doctor profile.');
      }
    };

    load();
  }, [user, navigate]);

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Doctor Assigned</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center animate-pulse">
        <Stethoscope className="w-8 h-8 text-indigo-600" />
      </div>
      <p className="text-gray-600">Loading your doctor profile...</p>
    </div>
  );
}
