import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { authService } from '@/services/auth.service';

export default function EmailVerified() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Invalid verification link');
        setIsVerifying(false);
        return;
      }

      try {
        await authService.verifyEmail(token);
        setVerified(true);
        setIsVerifying(false);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Verification failed');
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [token]);

  // UI countdown (runs only after verified)
  useEffect(() => {
    if (verified) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [verified]);

  // Separate effect for redirect (post-render safe)
  useEffect(() => {
    if (verified) {
      const timer = setTimeout(() => {
        navigate('/auth/login?verified=true');
      }, 5000);  // 5s delay

      return () => clearTimeout(timer);
    }
  }, [verified, navigate]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying your email...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
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

          <h1 className="text-2xl font-bold mb-3">Verification failed</h1>
          <p className="text-muted-foreground mb-8">{error}</p>

          <div className="space-y-3">
            <Link to="/auth/signup">
              <Button className="w-full">
                Sign up again
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-6 inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full"
        >
          <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
        </motion.div>

        <h1 className="text-3xl font-bold mb-3">Email verified!</h1>
        <p className="text-muted-foreground mb-8">
          Your email has been successfully verified. You can now access all features of your account.
        </p>

        <div className="bg-secondary/30 rounded-lg p-6 mb-6">
          <p className="text-sm text-muted-foreground">
            Redirecting to login in{' '}
            <span className="font-bold text-primary text-lg">{countdown}</span>{' '}
            seconds...
          </p>
        </div>

        <Link to="/auth/login?verified=true">
          <Button className="w-full">
            Continue to login
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}