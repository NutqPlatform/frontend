import { useAuth } from '../hooks/useAuth';
import { DoctorDashboard } from './DoctorDashboard';
import { PatientDashboard } from './patient/PatientDashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-ping opacity-20" />
              <div className="absolute inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-spin" />
              <div className="absolute inset-8 bg-white rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            </div>
            <p className="text-slate-600 font-medium">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={user?.role}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {user?.role === 'doctor' && <DoctorDashboard />}
        {user?.role === 'patient' && <PatientDashboard />}
        {!user?.role && (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full flex items-center justify-center text-4xl">
                ❓
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Unknown User Role</h2>
              <p className="text-slate-600">Please contact support for assistance.</p>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}