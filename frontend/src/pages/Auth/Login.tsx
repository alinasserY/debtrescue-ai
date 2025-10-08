import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  twoFactorCode: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setFocus,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      twoFactorCode: '',
    },
  });

  // Check for success messages from URL params
  useEffect(() => {
    const verified = searchParams.get('verified');
    const reset = searchParams.get('reset');
    
    if (verified === 'true') {
      setSuccess('Email verified successfully! You can now log in.');
    }
    if (reset === 'true') {
      setSuccess('Password reset successfully! Please log in with your new password.');
    }
  }, [searchParams]);

  // Auto-focus email field on mount
  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await authService.login({
        email: data.email,
        password: data.password,
        twoFactorCode: data.twoFactorCode,
      });

      // Check if 2FA is required
      if ('requiresTwoFactor' in result) {
        setShowTwoFactor(true);
        setTempUserId(result.userId);
        setFocus('twoFactorCode');
        return;
      }

      // Login successful
      setUser(result.user);
      
      // Navigate to dashboard or redirect URL
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      navigate(redirectTo);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Login failed';
      setError(errorMessage);
      
      // Shake animation on error
      const form = document.getElementById('login-form');
      form?.classList.add('animate-shake');
      setTimeout(() => form?.classList.remove('animate-shake'), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'microsoft' | 'apple') => {
    setIsLoading(true);
    setError(null);

    try {
      // In production, this would open OAuth popup/redirect
      // For now, we'll show a message
      if (provider === 'google') {
        // Simulate Google OAuth
        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}&redirect_uri=${window.location.origin}/auth/callback/google&response_type=code&scope=email profile`;
      } else if (provider === 'microsoft') {
        window.location.href = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${import.meta.env.VITE_MICROSOFT_CLIENT_ID}&redirect_uri=${window.location.origin}/auth/callback/microsoft&response_type=code&scope=openid email profile`;
      } else if (provider === 'apple') {
        window.location.href = `https://appleid.apple.com/auth/authorize?client_id=${import.meta.env.VITE_APPLE_CLIENT_ID}&redirect_uri=${window.location.origin}/auth/callback/apple&response_type=code&scope=email name`;
      }
    } catch (err: any) {
      setError(`${provider} login failed. Please try again.`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 mb-6"
              >
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-foreground">D</span>
                </div>
                <span className="text-2xl font-semibold">DebtRescue.AI</span>
              </motion.div>
            </Link>
            
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back
            </h1>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          {/* Success Message */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800 dark:text-green-300">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                  {error.includes('locked') && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Need help? <Link to="/support" className="underline">Contact support</Link>
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 text-sm font-medium"
              onClick={() => handleOAuthLogin('google')}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11 text-sm font-medium"
              onClick={() => handleOAuthLogin('microsoft')}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#F25022" d="M1 1h10v10H1z" />
                <path fill="#00A4EF" d="M13 1h10v10H13z" />
                <path fill="#7FBA00" d="M1 13h10v10H1z" />
                <path fill="#FFB900" d="M13 13h10v10H13z" />
              </svg>
              Continue with Microsoft
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11 text-sm font-medium"
              onClick={() => handleOAuthLogin('apple')}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Continue with Apple
            </Button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-background text-muted-foreground uppercase tracking-wider">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Login Form */}
          <form id="login-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email address
              </label>
              <Input
                {...register('email')}
                id="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                disabled={isLoading || showTwoFactor}
                error={errors.email?.message}
                icon={<Mail className="w-5 h-5" />}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <Input
                {...register('password')}
                id="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isLoading || showTwoFactor}
                error={errors.password?.message}
                icon={<Lock className="w-5 h-5" />}
              />
            </div>

            {/* Two-Factor Code (conditional) */}
            <AnimatePresence>
              {showTwoFactor && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label htmlFor="twoFactorCode" className="block text-sm font-medium text-foreground mb-2">
                    Two-factor authentication code
                  </label>
                  <Input
                    {...register('twoFactorCode')}
                    id="twoFactorCode"
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    autoComplete="one-time-code"
                    disabled={isLoading}
                    error={errors.twoFactorCode?.message}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer"
                />
                <span className="ml-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  Remember me
                </span>
              </label>
              
              <Link
                to="/auth/forgot-password"
                className="text-sm text-primary hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 text-sm font-medium"
              disabled={isLoading}
              isLoading={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : showTwoFactor ? (
                'Verify & Sign in'
              ) : (
                'Sign in'
              )}
            </Button>

            {/* Back to Email (if 2FA is shown) */}
            {showTwoFactor && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setShowTwoFactor(false);
                  setTempUserId(null);
                }}
              >
                Back to email login
              </Button>
            )}
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link
                to="/auth/signup"
                className="text-primary font-semibold hover:underline"
              >
                Sign up for free
              </Link>
            </p>
          </div>

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <Link to="/legal/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <span>•</span>
              <Link to="/legal/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <span>•</span>
              <Link to="/support" className="hover:text-foreground transition-colors">
                Help
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right side - Feature Showcase (hidden on mobile) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5 p-12 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-lg"
        >
          <div className="space-y-8">
            {/* Testimonial */}
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
                  💡
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Smart Debt Negotiation</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-powered negotiations that save you thousands
                  </p>
                </div>
              </div>
              <blockquote className="text-sm text-muted-foreground italic">
                "DebtRescue.AI helped me negotiate down $25,000 in debt. The process was seamless and the results exceeded my expectations."
              </blockquote>
              <div className="mt-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500"></div>
                <div>
                  <p className="text-sm font-medium">Sarah Johnson</p>
                  <p className="text-xs text-muted-foreground">Saved $25,000</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {[
                { icon: '🔒', title: 'Bank-level Security', desc: 'Your data is encrypted and secure' },
                { icon: '⚡', title: 'Instant Results', desc: 'See negotiation opportunities immediately' },
                { icon: '📊', title: 'Track Progress', desc: 'Monitor your debt reduction in real-time' },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-4 bg-card/30 backdrop-blur-sm border border-border rounded-xl p-4"
                >
                  <div className="text-3xl">{feature.icon}</div>
                  <div>
                    <h4 className="font-medium text-sm">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}