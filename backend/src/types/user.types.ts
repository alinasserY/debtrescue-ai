import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional().or(z.literal('')),
  avatar: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const kycDocumentSchema = z.object({
  documentType: z.enum(['passport', 'drivers_license', 'national_id', 'utility_bill', 'bank_statement']),
  documentNumber: z.string().min(1, 'Document number is required').optional(),
  frontImage: z.string().min(1, 'Front image is required'),
  backImage: z.string().optional(),
  selfieImage: z.string().optional(),
});

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar: string | null;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface UpdateProfileDTO {
  name?: string;
  phone?: string;
  avatar?: string;
}

export interface UpdatePasswordDTO {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface KYCDocumentDTO {
  documentType: 'passport' | 'drivers_license' | 'national_id' | 'utility_bill' | 'bank_statement';
  documentNumber?: string;
  frontImage: string;
  backImage?: string;
  selfieImage?: string;
}

export interface UserActivityLog {
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}