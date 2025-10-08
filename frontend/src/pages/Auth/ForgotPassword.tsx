import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '@/services/auth.service';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await authService.forgotPassword(data.email);
      setSuccess(true);
      setEmailSent(data.email);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>

          <h1 className="text-2xl font-bold mb-3">Check your email</h1>
          <p className="text-muted-foreground mb-6">
            We've sent a password reset link to:
          </p>
          <p className="text-sm font-medium bg-secondary/50 py-2 px-4 rounded-lg mb-6">
            {emailSent}
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Click the link in the email to reset your password. If you don't see it, check your spam folder.
          </p>

          <div className="space-y-3">
            <Button
              onClick={() => setSuccess(false)}
              variant="outline"
              className="w-full"
            >
              Try another email
            </Button>
            <Link to="/auth/login">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
              </Button>
            </Link>
          </div>

          <p className="mt-8 text-xs text-muted-foreground">
            Didn't receive the email?{' '}
            <button
              onClick={() => onSubmit({ email: emailSent })}
              className="text-primary hover:underline font-medium"
            >
              Resend
            </button>
          </p>
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
        {/* Back Button */}
        <Link to="/auth/login">
          <Button variant="ghost" size="sm" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to login
          </Button>
        </Link>

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
            Reset your password
          </h1>
          <p className="text-muted-foreground">
            Enter your email and we'll send you a reset link
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              autoFocus
              disabled={isLoading}
              error={errors.email?.message}
              icon={<Mail className="w-5 h-5" />}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11"
            disabled={isLoading}
            isLoading={isLoading}
          >
            Send reset link
          </Button>
        </form>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-secondary/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong className="text-foreground">Tip:</strong> Make sure to check your spam folder if you don't see the email within a few minutes.
          </p>
        </div>
      </motion.div>
    </div>
  );
}