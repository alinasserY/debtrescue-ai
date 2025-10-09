import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { LogOut, User, Shield, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user, logout, fetchUser, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user data on mount
    if (!user) {
      fetchUser().catch(() => {
        navigate('/auth/login');
      });
    }
  }, [user, fetchUser, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">D</span>
              </div>
              <h1 className="text-2xl font-bold">DebtRescue.AI</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">{user.name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h2 className="text-4xl font-bold mb-2">
            Welcome back, {user.name?.split(' ')[0] || 'there'}! 👋
          </h2>
          <p className="text-lg text-muted-foreground">
            Here's your debt relief dashboard
          </p>
        </motion.div>

        {/* Email Verification Warning */}
        {!user.emailVerified && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
          >
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              ⚠️ <strong>Action required:</strong> Please verify your email address to access all features.
              Check your inbox for the verification link.
            </p>
          </motion.div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">$0</p>
                <p className="text-sm text-muted-foreground">Total Debt</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p className="text-2xl font-bold">$0</p>
                <p className="text-sm text-muted-foreground">Saved</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Active Negotiations</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8"
        >
          <h3 className="text-2xl font-bold mb-4">Get Started</h3>
          <p className="text-muted-foreground mb-6">
            Let's set up your account and start reducing your debt
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button className="h-auto py-4 flex-col items-start text-left" variant="outline">
              <User className="w-6 h-6 mb-2" />
              <span className="font-semibold">Complete Your Profile</span>
              <span className="text-xs text-muted-foreground">Add your information</span>
            </Button>
            
            <Button className="h-auto py-4 flex-col items-start text-left" variant="outline">
              <CreditCard className="w-6 h-6 mb-2" />
              <span className="font-semibold">Link Your Accounts</span>
              <span className="text-xs text-muted-foreground">Connect your debts</span>
            </Button>

            <Button className="h-auto py-4 flex-col items-start text-left" variant="outline">
              <Shield className="w-6 h-6 mb-2" />
              <span className="font-semibold">Enable 2FA</span>
              <span className="text-xs text-muted-foreground">Secure your account</span>
            </Button>
            
            <Button className="h-auto py-4 flex-col items-start text-left">
              <span className="text-2xl mb-2">🚀</span>
              <span className="font-semibold">Start First Negotiation</span>
              <span className="text-xs opacity-75">Let AI help you save</span>
            </Button>
          </div>
        </motion.div>

        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-card border border-border rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold mb-4">Account Information</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Email</dt>
              <dd className="text-sm font-medium">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Email Verified</dt>
              <dd className="text-sm font-medium">
                {user.emailVerified ? (
                  <span className="text-green-600">✓ Verified</span>
                ) : (
                  <span className="text-yellow-600">⚠ Not Verified</span>
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Two-Factor Auth</dt>
              <dd className="text-sm font-medium">
                {user.twoFactorEnabled ? (
                  <span className="text-green-600">✓ Enabled</span>
                ) : (
                  <span className="text-muted-foreground">Disabled</span>
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Member Since</dt>
              <dd className="text-sm font-medium">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </dd>
            </div>
          </dl>
        </motion.div>
      </main>
    </div>
  );
}