import { useState, useEffect, useCallback } from 'react';
import { userService } from '@/services/user.service';
import { User, UpdateProfileData, UpdatePasswordData, UserActivity, UserSession } from '@/types/user.types';
import { useAuthStore } from '@/store/authStore';

// ============================================
// useUser Hook
// ============================================

export function useUser() {
  const { user: authUser, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await userService.getProfile();
      setUser(profile);
      return profile;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to fetch profile';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  // Update profile
  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedProfile = await userService.updateProfile(data);
      setUser(updatedProfile);
      return updatedProfile;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to update profile';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  // Update password
  const updatePassword = useCallback(async (data: UpdatePasswordData) => {
    setIsLoading(true);
    setError(null);
    try {
      await userService.updatePassword(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to update password';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    user: authUser,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    updatePassword,
  };
}

// ============================================
// useUserActivity Hook
// ============================================

export function useUserActivity() {
  const [activity, setActivity] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async (limit: number = 20) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userService.getActivity(limit);
      setActivity(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to fetch activity';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    activity,
    isLoading,
    error,
    fetchActivity,
  };
}

// ============================================
// useUserSessions Hook
// ============================================

export function useUserSessions() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userService.getSessions();
      setSessions(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to fetch sessions';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const revokeSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await userService.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to revoke session';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const revokeAllSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await userService.revokeAllSessions();
      await fetchSessions(); // Refresh list
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to revoke sessions';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchSessions]);

  return {
    sessions,
    isLoading,
    error,
    fetchSessions,
    revokeSession,
    revokeAllSessions,
  };
}