import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, useUserSessions, useUserActivity } from '@/hooks/useUser';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Lock,
  Shield,
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Smartphone,
  Monitor,
  Globe,
  Loader2,
  LogOut,
  Trash2,
  Copy,
  Download,
  QrCode,
} from 'lucide-react';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[!@#$%^&*]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirmation: z.string().refine((val) => val === 'DELETE', {
    message: 'Please type DELETE to confirm',
  }),
});

type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>;

export default function SecuritySettings() {
  const { user, updatePassword } = useUser();
  const { sessions, fetchSessions, revokeSession, revokeAllSessions } = useUserSessions();
  const { activity, fetchActivity } = useUserActivity();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState<'qr' | 'verify' | 'backup'>('qr');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const {
    register: registerDelete,
    handleSubmit: handleDeleteSubmit,
    formState: { errors: deleteErrors },
    reset: resetDelete,
  } = useForm<DeleteAccountFormData>({
    resolver: zodResolver(deleteAccountSchema),
  });

  useEffect(() => {
    fetchSessions();
    fetchActivity(10);
  }, [fetchSessions, fetchActivity]);

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsChangingPassword(true);
    setError(null);
    setSuccess(null);

    try {
      await updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      setSuccess('Password changed successfully. Logging out...');
      resetPassword();

      // Log out after 2 seconds
      setTimeout(() => {
        window.location.href = '/auth/login?reset=true';
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleEnable2FA = async () => {
    setShow2FAModal(true);
    setTwoFactorStep('qr');
    
    // TODO: Call backend to generate QR code
    // For now, using placeholder
    setQrCodeUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
  };

  const handleVerify2FA = async () => {
    if (twoFactorCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    // TODO: Verify 2FA code with backend
    // Mock success for now
    setTwoFactorStep('backup');
    setBackupCodes([
      'ABCD-1234-EFGH',
      'IJKL-5678-MNOP',
      'QRST-9012-UVWX',
      'YZAB-3456-CDEF',
      'GHIJ-7890-KLMN',
    ]);
  };

  const handleDisable2FA = async () => {
    if (confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      // TODO: Call backend to disable 2FA
      setSuccess('Two-factor authentication disabled');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setSuccess('Backup codes copied to clipboard');
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleDownloadBackupCodes = () => {
    const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'debtrescue-backup-codes.txt';
    a.click();
  };

  const handleComplete2FA = () => {
    setShow2FAModal(false);
    setSuccess('Two-factor authentication enabled successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession(sessionId);
      setSuccess('Session revoked successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to revoke session');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm('This will log you out from all other devices. Continue?')) {
      return;
    }

    try {
      await revokeAllSessions();
      setSuccess('All other sessions have been revoked');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to revoke sessions');
      setTimeout(() => setError(null), 3000);
    }
  };

  const onDeleteSubmit = async (data: DeleteAccountFormData) => {
    setIsDeletingAccount(true);
    setError(null);

    try {
      // TODO: Implement delete account API call
      alert('Account deletion not yet implemented in demo');
      setShowDeleteModal(false);
      resetDelete();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Monitor className="w-5 h-5" />;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  const formatActionName = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Security Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your password, two-factor authentication, and active sessions
        </p>
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3"
          >
            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
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
            exit={{ opacity: 0 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Password */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Change Password</h2>
            <p className="text-sm text-muted-foreground">Update your password regularly to keep your account secure</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
          {/* Current Password */}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium mb-2">
              Current Password
            </label>
            <div className="relative">
              <Input
                {...registerPassword('currentPassword')}
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Enter your current password"
                error={passwordErrors.currentPassword?.message}
                icon={<Lock className="w-5 h-5" />}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
              New Password
            </label>
            <div className="relative">
              <Input
                {...registerPassword('newPassword')}
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter your new password"
                error={passwordErrors.newPassword?.message}
                icon={<Lock className="w-5 h-5" />}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Input
                {...registerPassword('confirmPassword')}
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your new password"
                error={passwordErrors.confirmPassword?.message}
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

          <div className="flex justify-end">
            <Button type="submit" disabled={isChangingPassword} isLoading={isChangingPassword}>
              {isChangingPassword ? 'Changing Password...' : 'Change Password'}
            </Button>
          </div>
        </form>
      </motion.div>

      {/* Two-Factor Authentication */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-xl p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
            <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div>
            <p className="font-medium mb-1">Status</p>
            {user.twoFactorEnabled ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">✓ Enabled</span>
                <span className="text-xs text-muted-foreground">Your account is protected with 2FA</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">⚠ Disabled</span>
                <span className="text-xs text-muted-foreground">Enable 2FA to secure your account</span>
              </div>
            )}
          </div>
          {user.twoFactorEnabled ? (
            <Button variant="outline" onClick={handleDisable2FA}>
              Disable 2FA
            </Button>
          ) : (
            <Button onClick={handleEnable2FA}>Enable 2FA</Button>
          )}
        </div>
      </motion.div>

      {/* Active Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-xl p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Active Sessions</h2>
              <p className="text-sm text-muted-foreground">Manage devices where you're currently logged in</p>
            </div>
          </div>
          {sessions.length > 1 && (
            <Button variant="ghost" size="sm" onClick={handleRevokeAllSessions} className="text-red-600 hover:text-red-700">
              <LogOut className="w-4 h-4 mr-2" />
              Log out all devices
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">No active sessions found</p>
            </div>
          ) : (
            sessions.map((session, index) => (
              <div
                key={session.id}
                className="flex items-start justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    {getDeviceIcon(session.userAgent)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">
                        {session.userAgent?.includes('Mobile') ? 'Mobile Device' : 'Desktop'}
                      </p>
                      {index === 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1 truncate">
                      {session.ipAddress || 'Unknown location'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Last active:{' '}
                        {new Date(session.lastUsedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                {index !== 0 && (
                  <Button variant="ghost" size="sm" onClick={() => handleRevokeSession(session.id)} className="text-red-600 hover:text-red-700">
                    Revoke
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-xl p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <p className="text-sm text-muted-foreground">Your recent account security events</p>
          </div>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {activity.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            activity.map((log, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-0.5">{formatActionName(log.action)}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {new Date(log.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                    {log.ipAddress && (
                      <>
                        <span>•</span>
                        <span>{log.ipAddress}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card border-2 border-red-200 dark:border-red-800 rounded-xl overflow-hidden"
      >
        <div className="p-6 border-b border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">Danger Zone</h2>
              <p className="text-sm text-red-700 dark:text-red-300">Irreversible and destructive actions</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <Button variant="destructive" onClick={() => setShowDeleteModal(true)} className="ml-4">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </div>
      </motion.div>

      {/* 2FA Setup Modal */}
      <AnimatePresence>
        {show2FAModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShow2FAModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-xl max-w-md w-full"
            >
              {twoFactorStep === 'qr' && (
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <QrCode className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Scan QR Code</h3>
                      <p className="text-sm text-muted-foreground">Use your authenticator app</p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg mb-4 flex items-center justify-center">
                    <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                      <QrCode className="w-24 h-24 text-muted-foreground" />
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground text-center mb-6">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>

                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => setShow2FAModal(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={() => setTwoFactorStep('verify')} className="flex-1">
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {twoFactorStep === 'verify' && (
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Verify Code</h3>
                      <p className="text-sm text-muted-foreground">Enter the 6-digit code</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Authentication Code</label>
                    <Input
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      className="text-center text-2xl tracking-widest"
                    />
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Enter the 6-digit code from your authenticator app
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => setTwoFactorStep('qr')} className="flex-1">
                      Back
                    </Button>
                    <Button onClick={handleVerify2FA} className="flex-1">
                      Verify
                    </Button>
                  </div>
                </div>
              )}

              {twoFactorStep === 'backup' && (
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Save Backup Codes</h3>
                      <p className="text-sm text-muted-foreground">Keep these codes safe</p>
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg mb-4">
                    <div className="space-y-2 font-mono text-sm">
                      {backupCodes.map((code, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span>{code}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-6">
                    💡 Store these codes in a safe place. You can use them to access your accountif you lose your phone.
                  </p>

                  <div className="flex gap-3 mb-4">
                    <Button variant="outline" onClick={handleCopyBackupCodes} className="flex-1">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Codes
                    </Button>
                    <Button variant="outline" onClick={handleDownloadBackupCodes} className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>

                  <Button onClick={handleComplete2FA} className="w-full">
                    Complete Setup
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-xl max-w-md w-full"
            >
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Delete Account</h3>
                    <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleDeleteSubmit(onDeleteSubmit)}>
                <div className="p-6 space-y-4">
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-300">
                      <strong>Warning:</strong> This will permanently delete your account, all your data,
                      negotiations, and documents. This action is irreversible.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="deletePassword" className="block text-sm font-medium mb-2">
                      Enter your password to confirm
                    </label>
                    <Input
                      {...registerDelete('password')}
                      id="deletePassword"
                      type="password"
                      placeholder="Your password"
                      error={deleteErrors.password?.message}
                      icon={<Lock className="w-5 h-5" />}
                    />
                  </div>

                  <div>
                    <label htmlFor="deleteConfirmation" className="block text-sm font-medium mb-2">
                      Type <span className="font-mono font-bold">DELETE</span> to confirm
                    </label>
                    <Input
                      {...registerDelete('confirmation')}
                      id="deleteConfirmation"
                      type="text"
                      placeholder="DELETE"
                      error={deleteErrors.confirmation?.message}
                    />
                  </div>
                </div>

                <div className="p-6 bg-muted/30 border-t border-border flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowDeleteModal(false);
                      resetDelete();
                    }}
                    disabled={isDeletingAccount}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={isDeletingAccount}
                    isLoading={isDeletingAccount}
                  >
                    {isDeletingAccount ? 'Deleting...' : 'Delete My Account'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}