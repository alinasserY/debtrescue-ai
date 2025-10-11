// ============================================
// USER TYPES - Frontend
// ============================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar: string | null;
  company: string | null;
  jobTitle: string | null;
  website: string | null;
  bio: string | null;
  location: string | null;
  timezone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  avatar?: string;
  company?: string;
  jobTitle?: string;
  website?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserActivity {
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface UserSession {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
}