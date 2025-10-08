import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '@/services/auth.service';

export default function VerifyEmailNotice() {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  
  const location = useLocation();
  const email = location.state?.email || 'your email';

  const handleResend = async () => {
    if (email === 'your email') {
      setResendError('Email address not found. Please sign up again.');
      return;
    }

    setIsResending(true);
    setResendError(null);
    setResendSuccess(false);

    try {
      await authService.resendVerification(email);
      setResendSuccess(true);
    } catch (err: any) {
      setResendError(err.response?.data?.error?.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
            <Mail className="w-10 h-10 text-primary" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-3">
            Verify your email
          </h1>
          <p className="text-muted-foreground mb-2">
            We've sent a verification email to:
          </p>
          <p className="text-sm font-medium bg-secondary/50 py-2 px-4 rounded-lg inline-block mb-6">
            {email}
          </p>
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {resendSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800 dark:text-green-300">
                Verification email resent successfully! Check your inbox.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {resendError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{resendError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions */}
        <div className="bg-secondary/30 rounded-lg p-6 mb-6">
          <h3 className="font-semibold mb-3">What's next?</h3>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary text-xs font-semibold">
                1
              </span>
              <span>Check your inbox for an email from DebtRescue.AI</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary text-xs font-semibold">
                2
              </span>
              <span>Click the verification link in the email</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary text-xs font-semibold">
                3
              </span>
              <span>You'll be automatically redirected to your dashboard</span>
            </li>
          </ol>
        </div>

        {/* Tips */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            💡 <strong>Didn't receive the email?</strong> Check your spam or junk folder. Emails sometimes end up there by mistake.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleResend}
            variant="outline"
            className="w-full"
            disabled={isResending}
            isLoading={isResending}
          >
            {isResending ? 'Sending...' : 'Resend verification email'}
          </Button>

          <Link to="/auth/login">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </Button>
          </Link>
        </div>

        {/* Help */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Need help?{' '}
            <Link to="/support" className="text-primary hover:underline font-medium">
              Contact support
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}