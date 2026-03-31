import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './Layout';
import { DashboardPage } from '../features/patient/DashboardPage';
import { LoginPage } from '../features/auth/LoginPage';

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/therapies" element={<PlaceholderPage title="My Therapies" />} />
          <Route path="/results" element={<PlaceholderPage title="Results" />} />
          <Route path="/patients" element={<PlaceholderPage title="Patients" />} />
          <Route path="/admin" element={<PlaceholderPage title="Administration" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold text-text">{title}</h1>
      <p className="mt-2 text-lg text-text-secondary">Coming soon.</p>
    </div>
  );
}
