import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './Layout';
import { DashboardPage } from '../features/patient/DashboardPage';
import { LoginPage } from '../features/auth/LoginPage';
import { ClinicianDashboard } from '../features/clinician/ClinicianDashboard';
import { AdminDashboard } from '../features/admin/AdminDashboard';
import { VrtSessionPage } from '../features/therapy/VrtSessionPage';
import { NecSessionPage } from '../features/therapy/NecSessionPage';
import { NetSessionPage } from '../features/therapy/NetSessionPage';
import { CalibrationWizard } from '../features/therapy/CalibrationWizard';
import { TestHarness } from '../features/therapy/TestHarness';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && role && !allowedRoles.includes(role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}

function RoleDashboard() {
  const { role } = useAuth();
  if (role === 'Admin') return <AdminDashboard />;
  if (role === 'Clinician') return <ClinicianDashboard />;
  return <DashboardPage />;
}

export function Router() {
  const { loadFromStorage } = useAuth();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Therapy sessions -- accessible without portal chrome (fullscreen) */}
        <Route path="/therapy/vrt" element={<VrtSessionPage />} />
        <Route path="/therapy/nec" element={<NecSessionPage />} />
        <Route path="/therapy/net" element={<NetSessionPage />} />
        <Route path="/calibration" element={<CalibrationWizard onComplete={() => window.location.href = '/'} />} />
        <Route path="/test-harness" element={<TestHarness />} />

        {/* Protected portal routes */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<RoleDashboard />} />
          <Route path="/therapies" element={<DashboardPage />} />
          <Route path="/results" element={<Placeholder title="Results" />} />
          <Route path="/patients" element={
            <ProtectedRoute allowedRoles={['Clinician', 'Admin']}>
              <ClinicianDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold text-text">{title}</h1>
      <p className="mt-2 text-lg text-text-secondary">Coming soon.</p>
    </div>
  );
}
