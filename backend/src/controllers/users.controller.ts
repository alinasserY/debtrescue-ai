import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { uploadService } from '../services/upload.service';
import { AppError } from '../utils/errors';
import Joi from 'joi';

// Validation schema for profile update
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().allow(''),
  company: Joi.string().max(100).optional().allow(''),
  jobTitle: Joi.string().max(100).optional().allow(''),
  website: Joi.string().uri().optional().allow(''),
  bio: Joi.string().max(500).optional().allow(''),
  location: Joi.string().max(100).optional().allow(''),
  timezone: Joi.string().optional(),
  addressLine1: Joi.string().max(200).optional().allow(''),
  addressLine2: Joi.string().max(200).optional().allow(''),
  city: Joi.string().max(100).optional().allow(''),
  state: Joi.string().max(100).optional().allow(''),
  zipCode: Joi.string().max(20).optional().allow(''),
  country: Joi.string().max(100).optional().allow(''),
});

export class UsersController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const profile = await userService.getUserProfile(userId);

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const ipAddress = req.ip || req.socket.remoteAddress;

      // Validate with Joi
      const { error, value } = updateProfileSchema.validate(req.body);
      if (error) {
        throw new AppError(error.details[0].message, 400);
      }

      const updatedProfile = await userService.updateProfile(userId, value, ipAddress);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile,
      });
    } catch (error) {
      next(error);
    }
  }

  async getNotificationPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const preferences = await userService.getNotificationPreferences(userId);

      res.json({
        success: true,
        data: preferences,
      });
    } catch (error) {
      next(error);
    }
  }


  async updateNotificationPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const ipAddress = req.ip || req.socket.remoteAddress;

      const preferencesSchema = Joi.object({
        marketingEmails: Joi.boolean().optional(),
        productUpdates: Joi.boolean().optional(),
        weeklyDigest: Joi.boolean().optional(),
      });

      const { error, value } = preferencesSchema.validate(req.body);
      if (error) {
        throw new AppError(error.details[0].message, 400);
      }

      const updatedPreferences = await userService.updateNotificationPreferences(
        userId,
        value,
        ipAddress
      );

      res.json({
        success: true,
        message: 'Notification preferences updated successfully',
        data: updatedPreferences,
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const ipAddress = req.ip || req.socket.remoteAddress;

      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      // Upload file
      const avatarUrl = await uploadService.uploadAvatar(req.file, userId);

      // Update user profile
      const updatedProfile = await userService.updateAvatar(userId, avatarUrl, ipAddress);

      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatar: avatarUrl,
          profile: updatedProfile,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const ipAddress = req.ip || req.socket.remoteAddress;

      const passwordSchema = Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string()
          .min(8)
          .pattern(/[A-Z]/)
          .pattern(/[a-z]/)
          .pattern(/[0-9]/)
          .pattern(/[!@#$%^&*]/)
          .required()
          .messages({
            'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character',
          }),
        confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
          .messages({
            'any.only': 'Passwords do not match',
          }),
      });

      const { error, value } = passwordSchema.validate(req.body);
      if (error) {
        throw new AppError(error.details[0].message, 400);
      }

      await userService.updatePassword(userId, value, ipAddress);

      res.json({
        success: true,
        message: 'Password updated successfully. Please log in again with your new password.',
      });
    } catch (error) {
      next(error);
    }
  }

  async getActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const limit = parseInt(req.query.limit as string) || 20;
      const activity = await userService.getActivityLogs(userId, limit);

      res.json({
        success: true,
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const sessions = await userService.getActiveSessions(userId);

      res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  }

  async revokeSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const sessionId = req.params.sessionId;
      const ipAddress = req.ip || req.socket.remoteAddress;

      await userService.revokeSession(userId, sessionId, ipAddress);

      res.json({
        success: true,
        message: 'Session revoked successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async revokeAllSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const currentSessionId = req.session?.id || '';
      const ipAddress = req.ip || req.socket.remoteAddress;

      await userService.revokeAllSessions(userId, currentSessionId, ipAddress);

      res.json({
        success: true,
        message: 'All other sessions have been revoked',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { password } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;

      if (!password) {
        throw new AppError('Password is required to delete account', 400);
      }

      await userService.deleteAccount(userId, password, ipAddress);

      res.json({
        success: true,
        message: "Account deleted successfully. We're sorry to see you go.",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();