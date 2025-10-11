import { api } from './api';
import { User, UpdateProfileData, UpdatePasswordData, UserActivity, UserSession } from '@/types/user.types';

class UserService {
  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const response = await api.get('/users/me');
    return response.data.data;
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<User> {
    const response = await api.put('/users/me', data);
    return response.data.data;
  }

  /**
   * Update password
   */
  async updatePassword(data: UpdatePasswordData): Promise<void> {
    await api.put('/users/me/password', data);
  }


  /**
   * Upload avatar image
   */
  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data.avatar;
  }
  
  /**
   * Get user activity logs
   */
  async getActivity(limit: number = 20): Promise<UserActivity[]> {
    const response = await api.get('/users/me/activity', {
      params: { limit },
    });
    return response.data.data;
  }

  /**
   * Get active sessions
   */
  async getSessions(): Promise<UserSession[]> {
    const response = await api.get('/users/me/sessions');
    return response.data.data;
  }

  

  /**
   * Revoke a session
   */
  async revokeSession(sessionId: string): Promise<void> {
    await api.delete(`/users/me/sessions/${sessionId}`);
  }

  /**
   * Revoke all sessions except current
   */
  async revokeAllSessions(): Promise<void> {
    await api.delete('/users/me/sessions');
  }

  /**
   * Delete account
   */
  async deleteAccount(password: string): Promise<void> {
    await api.delete('/users/me', {
      data: { password },
    });
  }
}

export const userService = new UserService();