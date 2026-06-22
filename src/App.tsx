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
import { PatientAnalyticsDashboardPage } from './pages/doctor/PatientAnalyticsDashboardPage';
import { PlanExerciseSelectionPage } from './pages/doctor/PlanExerciseSelectionPage';
import { InvitationCodePage } from './pages/doctor/InvitationCodePage';
import { DoctorProfilePage } from './pages/doctor/DoctorProfilePage';
import { PlansPage } from './pages/doctor/PlansPage';
import { ExercisesPage } from './pages/doctor/ExercisesPage';
import { StatisticsPage } from './pages/doctor/StatisticsPage';
import { DoctorsPage } from './pages/DoctorsPage';
import { DoctorDetailPage } from './pages/DoctorDetailPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import DoctorProfilePagePatient from './pages/patient/DoctorProfilePage';
import ReviewDoctorPage from './pages/patient/ReviewDoctorPage';
import { PatientFindDoctorPage } from './pages/patient/PatientFindDoctorPage';
import { DoctorTransferRequestsPage } from './pages/doctor/DoctorTransferRequestsPage';

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
            path="/doctor/patients/:patientId/plans/new/exercises"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PlanExerciseSelectionPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients/:patientId/plans/:planId/exercises/add"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PlanExerciseSelectionPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients/:patientId/analytics"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PatientAnalyticsDashboardPage />
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
            path="/doctors"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DoctorsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctors/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DoctorDetailPage />
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
          <Route
            path="/patient/doctor/:doctorId/profile"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DoctorProfilePagePatient />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/transfer-requests"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DoctorTransferRequestsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/find-doctor"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PatientFindDoctorPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/doctor/:doctorId/review"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ReviewDoctorPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
