export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar: string | null;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface TwoFactorRequiredResponse {
  requiresTwoFactor: true;
  userId: string;
  message: string;
}

export interface OAuthProvider {
  provider: 'google' | 'microsoft' | 'apple';
  providerId: string;
  email: string;
  name?: string;
  avatar?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}