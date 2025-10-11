import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Bell, Mail, Smartphone, Globe, Check, AlertCircle, Loader2 } from 'lucide-react';
import { notificationService } from '@/services/notification.service';

interface NotificationSettings {
  marketingEmails: boolean;
  productUpdates: boolean;
  weeklyDigest: boolean;
  securityAlerts: boolean;
  negotiationUpdates: boolean;
  paymentReminders: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
}

export default function Notifications() {
  const [settings, setSettings] = useState<NotificationSettings>({
    marketingEmails: false,
    productUpdates: true,
    weeklyDigest: true,
    securityAlerts: true,
    negotiationUpdates: true,
    paymentReminders: true,
    smsNotifications: false,
    pushNotifications: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<NotificationSettings | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getPreferences();
      setSettings(data);
      setOriginalSettings(data);
    } catch (err: any) {
      setError('Failed to load notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: !prev[key] };
      
      // Check if there are changes
      if (originalSettings) {
        const changed = Object.keys(newSettings).some(
          (k) => newSettings[k as keyof NotificationSettings] !== originalSettings[k as keyof NotificationSettings]
        );
        setHasChanges(changed);
      }
      
      return newSettings;
    });
  };

const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // ONLY send editable fields to backend (filter out disabled ones)
      const editableSettings = {
        marketingEmails: settings.marketingEmails,
        productUpdates: settings.productUpdates,
        weeklyDigest: settings.weeklyDigest,
      };

      const updatedSettings = await notificationService.updatePreferences(editableSettings);
      
      // Merge response with full settings (backend only returns editable fields)
      const fullSettings = {
        ...settings,
        ...updatedSettings,
      };
      
      setSettings(fullSettings);
      setOriginalSettings(fullSettings);
      setSuccess('Notification preferences saved successfully');
      setHasChanges(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to save preferences:', err);
      setError(err.response?.data?.error?.message || 'Failed to save notification preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (originalSettings) {
      setSettings(originalSettings);
      setHasChanges(false);
    }
  };

  const notificationCategories = [
    {
      title: 'Email Notifications',
      icon: Mail,
      items: [
        {
          key: 'marketingEmails' as keyof NotificationSettings,
          label: 'Marketing & Promotions',
          description: 'Receive emails about new features, tips, and special offers',
        },
        {
          key: 'productUpdates' as keyof NotificationSettings,
          label: 'Product Updates',
          description: 'Important updates about DebtRescue.AI features and improvements',
        },
        {
          key: 'weeklyDigest' as keyof NotificationSettings,
          label: 'Weekly Digest',
          description: 'Weekly summary of your debt reduction progress and activity',
        },
        {
          key: 'securityAlerts' as keyof NotificationSettings,
          label: 'Security Alerts',
          description: 'Critical security notifications about your account (always enabled)',
          disabled: true,
        },
      ],
    },
    {
      title: 'Activity Notifications',
      icon: Bell,
      items: [
        {
          key: 'negotiationUpdates' as keyof NotificationSettings,
          label: 'Negotiation Updates',
          description: 'Get notified when your debt negotiations receive responses (always enabled)',
          disabled: true,
        },
        {
          key: 'paymentReminders' as keyof NotificationSettings,
          label: 'Payment Reminders',
          description: 'Reminders for upcoming debt payments and settlements (always enabled)',
          disabled: true,
        },
      ],
    },
    {
      title: 'Mobile & Push',
      icon: Smartphone,
      items: [
        {
          key: 'smsNotifications' as keyof NotificationSettings,
          label: 'SMS Notifications',
          description: 'Receive text messages for urgent updates (coming soon)',
          disabled: true,
        },
        {
          key: 'pushNotifications' as keyof NotificationSettings,
          label: 'Push Notifications',
          description: 'Browser and mobile push notifications for real-time updates (coming soon)',
          disabled: true,
        },
      ],
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Notification Preferences</h1>
        <p className="text-muted-foreground mt-1">
          Manage how you receive updates and alerts from DebtRescue.AI
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

      {/* Notification Settings */}
      <div className="space-y-6">
        {notificationCategories.map((category, categoryIndex) => {
          const Icon = category.icon;
          return (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <div className="p-6 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold">{category.title}</h2>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {category.items.map((item) => (
                  <div key={item.key} className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <label
                        htmlFor={item.key}
                        className={`text-sm font-medium mb-1 block ${
                          item.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                        }`}
                      >
                        {item.label}
                      </label>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <button
                      type="button"
                      id={item.key}
                      role="switch"
                      aria-checked={settings[item.key]}
                      disabled={item.disabled}
                      onClick={() => !item.disabled && handleToggle(item.key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                        settings[item.key] ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                          settings[item.key] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Save Button */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex items-center justify-between gap-3 p-4 bg-muted/50 rounded-lg border border-border"
        >
          <p className="text-sm text-muted-foreground">You have unsaved changes</p>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleReset} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} isLoading={isSaving}>
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3"
      >
        <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-medium mb-1">Privacy First</p>
          <p>
            We respect your inbox. You can change these settings anytime, and we'll never sell your
            information to third parties.
          </p>
        </div>
      </motion.div>
    </div>
  );
}