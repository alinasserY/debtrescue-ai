import { create } from 'zustand';
import { authService } from '@/services/auth.service';
import type { User } from '@/types/auth.types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: authService.isAuthenticated(),
  isLoading: false,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const result = await authService.login({ email, password });
      
      if ('requiresTwoFactor' in result) {
        set({ isLoading: false });
        throw new Error('2FA_REQUIRED');
      }
      
      set({ user: result.user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.error?.message || error.message 
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      set({ user: null, isAuthenticated: false, error: null });
    }
  },

  fetchUser: async () => {
    try {
      set({ isLoading: true, error: null });
      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: error.response?.data?.error?.message || error.message 
      });
      throw error;
    }
  },
}));