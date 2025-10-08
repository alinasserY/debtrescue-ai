import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '@/services/auth.service';

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch('password');

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError('Invalid or missing reset token');
    } else {
      setTokenValid(true);
    }
  }, [token]);

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

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.resetPassword(token, data.password);
      
      // Redirect to login with success message
      navigate('/auth/login?reset=true');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to reset password';
      setError(errorMessage);
      
      // If token is invalid/expired, show option to request new one
      if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
        setTokenValid(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Invalid token state
  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>

          <h1 className="text-2xl font-bold mb-3">Invalid or expired link</h1>
          <p className="text-muted-foreground mb-8">
            This password reset link is invalid or has expired. Password reset links are only valid for 1 hour.
          </p>

          <div className="space-y-3">
            <Link to="/auth/forgot-password">
              <Button className="w-full">
                Request new reset link
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button variant="ghost" className="w-full">
                Back to login
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">D</span>
              </div>
              <span className="text-2xl font-semibold">DebtRescue.AI</span>
            </div>
          </Link>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Set new password
          </h1>
          <p className="text-muted-foreground">
            Create a strong password for your account
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

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* New Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              New password
            </label>
            <div className="relative">
              <Input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                autoComplete="new-password"
                autoFocus
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
                    At least one special character
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
              Confirm new password
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

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-11"
            disabled={isLoading}
            isLoading={isLoading}
          >
            Reset password
          </Button>
        </form>

        {/* Security Note */}
        <div className="mt-6 p-4 bg-secondary/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            🔒 <strong className="text-foreground">Security tip:</strong> After resetting your password, you'll be logged out of all devices for your security.
          </p>
        </div>
      </motion.div>
    </div>
  );
}