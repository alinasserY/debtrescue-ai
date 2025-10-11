import { api } from './api';

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

class NotificationService {
  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationSettings> {
    const response = await api.get('/users/me/notifications');
    return response.data.data;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const response = await api.put('/users/me/notifications', preferences);
    return response.data.data;
  }
}

export const notificationService = new NotificationService();