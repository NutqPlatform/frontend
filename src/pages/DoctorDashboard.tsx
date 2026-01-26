import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function DoctorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navigationItems = [
    { id: 'profile', label: 'Profile', icon: '👤', path: '/doctor/profile' },
    { id: 'statistics', label: 'Statistics', icon: '📊', path: '/doctor/statistics' },
    { id: 'patients', label: 'Patients', icon: '👥', path: '/doctor/patients' },
    { id: 'exercises', label: 'Exercises', icon: '🏃', path: '/doctor/exercises' },
    { id: 'plans', label: 'Plans', icon: '📋', path: '/doctor/plans' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Doctor Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">Welcome, {user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Logout
          </button>
        </div>

        {/* Navigation Icons */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="group flex flex-col items-center justify-center rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:shadow-md"
            >
              <div className="mb-4 text-5xl">{item.icon}</div>
              <div className="text-lg font-medium text-slate-900">{item.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
