import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PublicOnlyRoute } from './routes/PublicOnlyRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { PatientProfilePage } from './pages/patient/PatientProfilePage';
import { PatientPlansPage } from './pages/patient/PatientPlansPage';
import { PatientReportsPage } from './pages/patient/PatientReportsPage';
import { PronounceWordExercisePage } from './pages/patient/PronounceWordExercisePage';
import { PatientStatisticsPage } from './pages/patient/PatientStatisticsPage';
import { PatientsListPage } from './pages/doctor/PatientsListPage';
import { PatientDetailPage } from './pages/doctor/PatientDetailPage';
import { InvitationCodePage } from './pages/doctor/InvitationCodePage';
import { DoctorProfilePage } from './pages/doctor/DoctorProfilePage';
import { PlansPage } from './pages/doctor/PlansPage';
import { ExercisesPage } from './pages/doctor/ExercisesPage';
import { StatisticsPage } from './pages/doctor/StatisticsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor"
            element={
              <ProtectedRoute>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients"
            element={
              <ProtectedRoute>
                <PatientsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients/:id"
            element={
              <ProtectedRoute>
                <PatientDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients/invitation-code"
            element={
              <ProtectedRoute>
                <InvitationCodePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/profile"
            element={
              <ProtectedRoute>
                <DoctorProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/plans"
            element={
              <ProtectedRoute>
                <PlansPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/exercises"
            element={
              <ProtectedRoute>
                <ExercisesPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/doctor/statistics"
            element={
              <ProtectedRoute>
                <StatisticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/profile"
            element={
              <ProtectedRoute>
                <PatientProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/plans"
            element={
              <ProtectedRoute>
                <PatientPlansPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/reports"
            element={
              <ProtectedRoute>
                <PatientReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/exercise/:planId/:planExerciseId"
            element={
              <ProtectedRoute>
                <PronounceWordExercisePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/statistics"
            element={
              <ProtectedRoute>
                <PatientStatisticsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
