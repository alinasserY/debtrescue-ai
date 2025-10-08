import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, Lock, User, Phone, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number').optional().or(z.literal('')),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setFocus,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      phone: '',
      agreeToTerms: false,
    },
  });

  const password = watch('password');

  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 10;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[!@#$%^&*]/.test(password)) strength += 15;

    setPasswordStrength(Math.min(strength, 100));
  }, [password]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-red-500';
    if (passwordStrength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 70) return 'Medium';
    return 'Strong';
  };

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.signup({
        email: data.email,
        password: data.password,
        name: data.name,
        phone: data.phone,
      });

      setUser(result.user);
      
      // Navigate to email verification notice
      navigate('/auth/verify-email-notice', { 
        state: { email: data.email } 
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Signup failed';
      setError(errorMessage);
      
      const form = document.getElementById('signup-form');
      form?.classList.add('animate-shake');
      setTimeout(() => form?.classList.remove('animate-shake'), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignup = async (provider: 'google' | 'microsoft' | 'apple') => {
    setIsLoading(true);
    setError(null);

    try {
      if (provider === 'google') {
        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}&redirect_uri=${window.location.origin}/auth/callback/google&response_type=code&scope=email profile`;
      } else if (provider === 'microsoft') {
        window.location.href = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${import.meta.env.VITE_MICROSOFT_CLIENT_ID}&redirect_uri=${window.location.origin}/auth/callback/microsoft&response_type=code&scope=openid email profile`;
      } else if (provider === 'apple') {
        window.location.href = `https://appleid.apple.com/auth/authorize?client_id=${import.meta.env.VITE_APPLE_CLIENT_ID}&redirect_uri=${window.location.origin}/auth/callback/apple&response_type=code&scope=email name`;
      }
    } catch (err: any) {
      setError(`${provider} signup failed. Please try again.`);
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
              Create your account
            </h1>
            <p className="text-muted-foreground">
              Start your journey to financial freedom
            </p>
          </div>

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
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 text-sm font-medium"
              onClick={() => handleOAuthSignup('google')}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11 text-sm font-medium"
              onClick={() => handleOAuthSignup('microsoft')}
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
              onClick={() => handleOAuthSignup('apple')}
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
                Or sign up with email
              </span>
            </div>
          </div>

          {/* Signup Form */}
          <form id="signup-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email address <span className="text-destructive">*</span>
              </label>
              <Input
                {...register('email')}
                id="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                disabled={isLoading}
                error={errors.email?.message}
                icon={<Mail className="w-5 h-5" />}
              />
            </div>

            {/* Name (Optional) */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Full name <span className="text-xs text-muted-foreground">(Optional)</span>
              </label>
              <Input
                {...register('name')}
                id="name"
                type="text"
                placeholder="John Doe"
                autoComplete="name"
                disabled={isLoading}
                error={errors.name?.message}
                icon={<User className="w-5 h-5" />}
              />
            </div>

            {/* Phone (Optional) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                Phone number <span className="text-xs text-muted-foreground">(Optional)</span>
              </label>
              <Input
                {...register('phone')}
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                autoComplete="tel"
                disabled={isLoading}
                error={errors.phone?.message}
                icon={<Phone className="w-5 h-5" />}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                We'll use this for important account notifications
              </p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  disabled={isLoading}
                  error={errors.password?.message}
                  icon={<Lock className="w-5 h-5" />}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Password strength:</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength < 40 ? 'text-red-600' : 
                      passwordStrength < 70 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${getPasswordStrengthColor()}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${passwordStrength}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <li className="flex items-center gap-1">
                      {password.length >= 8 ? (
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border-2 border-muted" />
                      )}
                      At least 8 characters
                    </li>
                    <li className="flex items-center gap-1">
                      {/[A-Z]/.test(password) && /[a-z]/.test(password) ? (
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border-2 border-muted" />
                      )}
                      Upper and lowercase letters
                    </li>
                    <li className="flex items-center gap-1">
                      {/[0-9]/.test(password) ? (
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border-2 border-muted" />
                      )}
                      At least one number
                    </li>
                    <li className="flex items-center gap-1">
                      {/[!@#$%^&*]/.test(password) ? (
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border-2 border-muted" />
                      )}
                      At least one special character (!@#$%^&*)
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                Confirm password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  {...register('confirmPassword')}
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  disabled={isLoading}
                  error={errors.confirmPassword?.message}
                  icon={<Lock className="w-5 h-5" />}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  {...register('agreeToTerms')}
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  I agree to the{' '}
                  <Link to="/legal/terms" className="text-primary hover:underline font-medium">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/legal/privacy" className="text-primary hover:underline font-medium">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.agreeToTerms && (
                <p className="text-sm text-destructive">{errors.agreeToTerms.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 text-sm font-medium"
              disabled={isLoading}
              isLoading={isLoading}
            >
              Create account
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/auth/login"
                className="text-primary font-semibold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right side - Benefits */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5 p-12 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-lg space-y-8"
        >
          <div>
            <h2 className="text-3xl font-bold mb-4">Join thousands saving on debt</h2>
            <p className="text-lg text-muted-foreground">
              Our AI-powered platform has helped users save over $150M in debt negotiations.
            </p>
          </div>

          <div className="space-y-6">
            {[
              { 
                stat: '$12,500', 
                label: 'Average savings per user',
                icon: '💰'
              },
              { 
                stat: '85%', 
                label: 'Success rate in negotiations',
                icon: '📈'
              },
              { 
                stat: '< 30 days', 
                label: 'Average time to results',
                icon: '⚡'
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{item.icon}</div>
                  <div>
                    <div className="text-2xl font-bold">{item.stat}</div>
                    <div className="text-sm text-muted-foreground">{item.label}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}