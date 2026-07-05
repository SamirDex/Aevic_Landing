import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ResetPasswordModal } from './components/ResetPasswordModal';

const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.default })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const StoryPage = lazy(() => import('./pages/StoryPage').then(m => ({ default: m.StoryPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const AdminPanelPage = lazy(() => import('./pages/AdminPanelPage').then(m => ({ default: m.AdminPanelPage })));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })));
const SchedulePage = lazy(() => import('./pages/SchedulePage').then(m => ({ default: m.SchedulePage })));

function ResetPasswordHandler() {
  const [resetData, setResetData] = useState<{ email: string; token: string } | null>(null);
  const location = useLocation();

  useEffect(() => {
    const url = new URL(window.location.href);
    let token: string | null = null;
    let email: string | null = null;

    if (url.pathname === '/reset-password') {
      token = url.searchParams.get('token');
      email = url.searchParams.get('email');
    } else if (url.hash.includes('reset')) {
      const params = new URLSearchParams(url.hash.replace(/^#reset\?/, ''));
      token = params.get('token');
      email = params.get('email');
    }

    if (token && email) {
      setResetData({ token, email });
      window.history.replaceState(null, '', '/');
    }
  }, [location]);

  return resetData ? (
    <ResetPasswordModal
      email={resetData.email}
      token={resetData.token}
      onClose={() => setResetData(null)}
      onSuccess={() => {
        setResetData(null);
        window.location.href = '/panel';
      }}
    />
  ) : null;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ResetPasswordHandler />
        <Suspense fallback={<div className="loading">Yüklənir...</div>}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="/qeydiyyat" element={<RegisterPage />} />
              <Route path="/reqlament" element={<StoryPage />} />
              <Route path="/liderlik" element={<LeaderboardPage />} />
              <Route path="/cedvel" element={<SchedulePage />} />
              <Route path="/panel" element={<DashboardPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Route>
            <Route path="/admin" element={<AdminLoginPage />} />
            <Route path="/admin/panel" element={<AdminPanelPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
