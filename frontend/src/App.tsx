import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import VerifyEmailNotice from './pages/Auth/VerifyEmailNotice';
import EmailVerified from './pages/Auth/EmailVerified';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/auth/verify-email-notice" element={<VerifyEmailNotice />} />
        <Route path="/auth/verify-email" element={<EmailVerified />} />
        
        {/* Redirect root to login for now */}
        <Route path="/" element={<Navigate to="/auth/login" replace />} />
        
        {/* Catch all - 404 */}
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;