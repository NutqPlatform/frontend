import { useAuth } from '../hooks/useAuth';
import { DoctorDashboard } from './DoctorDashboard';
import { PatientDashboard } from './patient/PatientDashboard';

export function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (user?.role === 'doctor') {
    return <DoctorDashboard />;
  }

  if (user?.role === 'patient') {
    return <PatientDashboard />;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">Unknown user role</div>
      </div>
    </div>
  );
}
