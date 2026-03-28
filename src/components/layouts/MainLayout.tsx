import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  Menu, X, Home, Users, FileText, Activity, 
  User, LogOut, Dumbbell
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);


  const doctorNavItems = [
    { label: 'Dashboard', icon: <Home size={20} />, path: '/doctor', roles: ['doctor'] },
    { label: 'Doctors', icon: <Users size={20} />, path: '/doctors', roles: ['doctor'] },
    { label: 'Patients', icon: <Users size={20} />, path: '/doctor/patients', roles: ['doctor'] },
    { label: 'Plans', icon: <FileText size={20} />, path: '/doctor/plans', roles: ['doctor'] },
    { label: 'Exercises', icon: <Dumbbell size={20} />, path: '/doctor/exercises', roles: ['doctor'] },
    { label: 'Profile', icon: <User size={20} />, path: '/doctor/profile', roles: ['doctor'] },
  ];

  const patientNavItems = [
  { label: 'Dashboard', icon: <Home size={20} />, path: '/dashboard', roles: ['patient'] },
  { label: 'My Plans', icon: <FileText size={20} />, path: '/patient/plans', roles: ['patient'] },
  { label: 'Weekly Reports', icon: <Activity size={20} />, path: '/patient/reports', roles: ['patient'] }, // Changed from "Progress"
  { label: 'Profile', icon: <User size={20} />, path: '/patient/profile', roles: ['patient'] },
];

  const navItems = user?.role === 'doctor' ? doctorNavItems : patientNavItems;

  const isActive = (path: string) => location.pathname === path;

  const handleNavigate = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  // Get user's first letter for avatar
  const getUserInitial = () => {
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  // Get user display name
  const getDisplayName = () => {
    // Check if user has a name property, otherwise use email
    if ((user as any)?.name) {
      return (user as any).name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-6 right-6 z-50 lg:hidden p-3 rounded-2xl bg-white shadow-xl border border-slate-200/60 backdrop-blur-sm"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-80 transform bg-gradient-to-b from-white to-slate-50/80 
          shadow-2xl border-r border-slate-200/60 backdrop-blur-sm transition-transform duration-500 ease-out
          lg:static lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo / Brand */}
        <div className="flex h-24 items-center justify-center border-b border-slate-200/60">
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Nutq
            </h1>
            <p className="text-sm text-slate-500 mt-1">Therapy Intelligence Platform</p>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="p-6 border-b border-slate-200/60">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                {getUserInitial()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">{getDisplayName()}</h3>
              <p className="text-sm text-slate-600 truncate">{user?.email || 'No email'}</p>
              <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {user?.role === 'doctor' ? '👨‍⚕️ Doctor' : '👤 Patient'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-2 p-6">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={`
                flex items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-300
                ${isActive(item.path)
                  ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 border-l-4 border-blue-500 shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100/50 hover:pl-6'
                }
              `}
            >
              <span className={`${isActive(item.path) ? 'text-blue-500' : 'text-slate-500'}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
         
          

          {/* Settings & Logout */}
          <div className="flex gap-2">
            
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:shadow-lg hover:opacity-95 transition-all"
            >
              <LogOut size={18} />
              <span className="text-sm font-semibold">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="px-4 py-8 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {/* Animated background elements */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-200/20 to-purple-200/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-cyan-200/20 to-emerald-200/20 rounded-full blur-3xl" />
            </div>
            {children}
          </div>
        </div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden animate-in fade-in duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}