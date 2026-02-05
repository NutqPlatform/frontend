import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PublicOnlyRoute } from './routes/PublicOnlyRoute';
import { MainLayout } from './components/layouts/MainLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { PatientProfilePage } from './pages/patient/PatientProfilePage';
import { PatientPlansPage } from './pages/patient/PatientPlansPage';
import { PatientReportsPage } from './pages/patient/PatientReportsPage';
import { PronounceWordExercisePage } from './pages/patient/PronounceWordExercisePage';
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
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DoctorDashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PatientsListPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PatientDetailPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients/invitation-code"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <InvitationCodePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/profile"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DoctorProfilePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/plans"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PlansPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor/exercises"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ExercisesPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/doctor/statistics"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <StatisticsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/profile"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PatientProfilePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/plans"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PatientPlansPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/reports"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PatientReportsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/exercise/:planId/:planExerciseId"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PronounceWordExercisePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
