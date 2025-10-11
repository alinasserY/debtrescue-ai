import { User } from '@prisma/client';
import { userRepository } from '../repositories/user.repository';
import bcryptjs from 'bcryptjs';
import { AppError } from '../utils/errors';
import { auditLogService } from './auditLog.service';

export class UserService {
  async getUserProfile(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.deletedAt) {
      throw new AppError('Account has been deleted', 403);
    }

    if (user.isSuspended) {
      throw new AppError('Account has been suspended', 403);
    }

    // Return all user fields including new profile fields
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      company: (user as any).company,
      jobTitle: (user as any).jobTitle,
      website: (user as any).website,
      bio: (user as any).bio,
      location: (user as any).location,
      timezone: (user as any).timezone,
      addressLine1: (user as any).addressLine1,
      addressLine2: (user as any).addressLine2,
      city: (user as any).city,
      state: (user as any).state,
      zipCode: (user as any).zipCode,
      country: (user as any).country,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  async updateProfile(userId: string, data: any, ipAddress?: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Validate phone number if provided
    if (data.phone && data.phone !== '') {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(data.phone)) {
        throw new AppError('Invalid phone number format', 400);
      }
    }

    // Update profile with all new fields
    const updatedUser = await userRepository.updateProfile(userId, {
      name: data.name,
      phone: data.phone || null,
      avatar: data.avatar || null,
      company: data.company || null,
      jobTitle: data.jobTitle || null,
      website: data.website || null,
      bio: data.bio || null,
      location: data.location || null,
      timezone: data.timezone || null,
      addressLine1: data.addressLine1 || null,
      addressLine2: data.addressLine2 || null,
      city: data.city || null,
      state: data.state || null,
      zipCode: data.zipCode || null,
      country: data.country || null,
    });

    // Log action
    await auditLogService.log({
      userId,
      action: 'profile_updated',
      entityType: 'User',
      entityId: userId,
      ipAddress,
      metadata: {
        fields: Object.keys(data),
      },
    });

    return this.getUserProfile(userId);
  }

  async updatePassword(userId: string, data: any, ipAddress?: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.hashedPassword) {
      throw new AppError('Cannot change password for OAuth-only accounts', 400);
    }




    
    // Verify current password
    const isValidPassword = await bcryptjs.compare(data.currentPassword, user.hashedPassword);
    if (!isValidPassword) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Hash new password
    const hashedPassword = await bcryptjs.hash(data.newPassword, 12);

    // Update password
    await userRepository.updatePassword(userId, hashedPassword);

    // Log action
    await auditLogService.log({
      userId,
      action: 'password_changed',
      entityType: 'User',
      entityId: userId,
      ipAddress,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  }

async updateAvatar(userId: string, avatarUrl: string, ipAddress?: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Update avatar in database
    const updatedUser = await userRepository.updateProfile(userId, {
      avatar: avatarUrl,
    });

    // Log action
    await auditLogService.log({
      userId,
      action: 'avatar_updated',
      entityType: 'User',
      entityId: userId,
      ipAddress,
    });

    return this.getUserProfile(userId);
  }

  async getActivityLogs(userId: string, limit: number = 20) {
    const logs = await userRepository.getActivityLogs(userId, limit);

    return logs.map((log: any) => ({
      action: log.action,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    }));
  }

  async getActiveSessions(userId: string) {
    return await userRepository.getActiveSessions(userId);
  }

  async revokeSession(userId: string, sessionId: string, ipAddress?: string) {
    await userRepository.revokeSession(sessionId, userId);

    await auditLogService.log({
      userId,
      action: 'session_revoked',
      entityType: 'Session',
      entityId: sessionId,
      ipAddress,
    });
  }

  async getNotificationPreferences(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      marketingEmails: user.marketingEmails,
      productUpdates: user.productUpdates,
      weeklyDigest: user.weeklyDigest,
      securityAlerts: true,
      negotiationUpdates: true,
      paymentReminders: true,
      smsNotifications: false,
      pushNotifications: true,
    };
  }

  async updateNotificationPreferences(userId: string, data: any, ipAddress?: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updatedUser = await userRepository.updateNotificationPreferences(userId, {
      marketingEmails: data.marketingEmails,
      productUpdates: data.productUpdates,
      weeklyDigest: data.weeklyDigest,
    });

    await auditLogService.log({
      userId,
      action: 'notification_preferences_updated',
      entityType: 'User',
      entityId: userId,
      ipAddress,
      metadata: { preferences: data },
    });

    return this.getNotificationPreferences(userId);
  }

  async revokeAllSessions(userId: string, currentSessionId: string, ipAddress?: string) {
    const revokedCount = await userRepository.revokeAllSessionsExcept(userId, currentSessionId);

    await auditLogService.log({
      userId,
      action: 'all_sessions_revoked',
      entityType: 'User',
      entityId: userId,
      ipAddress,
      metadata: {
        revokedCount,
      },
    });
  }

  async deleteAccount(userId: string, password: string, ipAddress?: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify password before deletion
    if (user.hashedPassword) {
      const isValidPassword = await bcryptjs.compare(password, user.hashedPassword);
      if (!isValidPassword) {
        throw new AppError('Password is incorrect', 401);
      }
    }

    // Soft delete
    await userRepository.softDelete(userId);

    // Log action
    await auditLogService.log({
      userId,
      action: 'account_deleted',
      entityType: 'User',
      entityId: userId,
      ipAddress,
      metadata: {
        deletedAt: new Date().toISOString(),
      },
    });
  }
}

export const userService = new UserService();