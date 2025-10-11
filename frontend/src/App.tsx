import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import VerifyEmailNotice from './pages/Auth/VerifyEmailNotice';
import EmailVerified from './pages/Auth/EmailVerified';
import Dashboard from './pages/Dashboard/Dashboard';
import Profile from '@/pages/Account/Profile';
import SecuritySettings from '@/pages/Account/SecuritySettings';
import AppLayout from '@/components/layout/AppLayout'; // ADD THIS LAYOUT
import Notifications from '@/pages/Account/Notifications'; // ADD THIS NOTIFICATION
import Billing from '@/pages/Account/Billing'; // ADD THIS BILLING




// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />

        {/* Protected routes with AppLayout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/account/profile" element={<Profile />} />
          <Route path="/account/security" element={<SecuritySettings />} />
          <Route path="/account/billing" element={<Billing />} />
          <Route path="/account/notifications" element={<Notifications />} />
        </Route>

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;