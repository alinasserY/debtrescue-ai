import api from './api';
import type {
  LoginRequest,
  SignupRequest,
  AuthResponse,
  ApiResponse,
  TwoFactorRequiredResponse,
  OAuthProvider,
  User,
} from '@/types/auth.types';

class AuthService {
  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/signup', data);
    
    if (response.data.success && response.data.data) {
      localStorage.setItem('accessToken', response.data.data.accessToken);
      return response.data.data;
    }
    
    throw new Error(response.data.error?.message || 'Signup failed');
  }

  async login(data: LoginRequest): Promise<AuthResponse | TwoFactorRequiredResponse> {
    const response = await api.post<ApiResponse<AuthResponse | TwoFactorRequiredResponse>>('/auth/login', data);

    if (response.data.success && response.data.data) {
      if ('requiresTwoFactor' in response.data.data) {
        return response.data.data;
      }

      localStorage.setItem('accessToken', response.data.data.accessToken);
      return response.data.data;
    }

    throw new Error(response.data.error?.message || 'Login failed');
  }

  async oauthLogin(provider: OAuthProvider): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>(`/auth/oauth/${provider.provider}`, provider);

    if (response.data.success && response.data.data) {
      localStorage.setItem('accessToken', response.data.data.accessToken);
      return response.data.data;
    }

    throw new Error(response.data.error?.message || 'OAuth login failed');
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
    }
  }

  async logoutAll(): Promise<void> {
    try {
      await api.post('/auth/logout-all');
    } finally {
      localStorage.removeItem('accessToken');
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    
    if (response.data.success && response.data.data) {
      return response.data.data.user;
    }
    
    throw new Error('Failed to fetch user');
  }

  async verifyEmail(token: string): Promise<void> {
    const response = await api.post<ApiResponse>('/auth/verify-email', { token });
    
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Email verification failed');
    }
  }

  async resendVerification(email: string): Promise<void> {
    await api.post('/auth/resend-verification', { email });
  }

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const response = await api.post<ApiResponse>('/auth/reset-password', { token, password });
    
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Password reset failed');
    }
  }

  async setup2FA(): Promise<{ secret: string; qrCodeUrl: string }> {
    const response = await api.post<ApiResponse<{ secret: string; qrCodeUrl: string }>>('/auth/2fa/setup');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Failed to setup 2FA');
  }

  async verify2FA(code: string): Promise<{ backupCodes: string[] }> {
    const response = await api.post<ApiResponse<{ backupCodes: string[] }>>('/auth/2fa/verify', { code });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Invalid verification code');
  }

  async disable2FA(password: string): Promise<void> {
    const response = await api.post<ApiResponse>('/auth/2fa/disable', { password });
    
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to disable 2FA');
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }
}

export const authService = new AuthService();