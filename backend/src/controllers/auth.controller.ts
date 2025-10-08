import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AppError } from '../utils/errors';
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verify2FASchema,
  disable2FASchema,
} from '../validators/auth.validator';
import { logger } from '../utils/logger';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

export class AuthController {
  /**
   * POST /api/v1/auth/signup
   * Register a new user
   */
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const { error, value } = signupSchema.validate(req.body);
      if (error) {
        throw new AppError(error.details[0].message, 400);
      }

      const userAgent = req.get('user-agent');
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await authService.signup(value, userAgent, ipAddress);

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/login
   * Login user
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        throw new AppError(error.details[0].message, 400);
      }

      const userAgent = req.get('user-agent');
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await authService.login({
        ...value,
        userAgent,
        ipAddress,
      });

      // If 2FA is required, return early
      if ('requiresTwoFactor' in result) {
        return res.status(200).json({
          success: true,
          requiresTwoFactor: true,
          userId: result.userId,
          message: result.message,
        });
      }

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/oauth/:provider
   * OAuth login (Google, Microsoft, Apple)
   */
  async oauthLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { provider } = req.params;
      const { providerId, email, name, avatar } = req.body;

      if (!['google', 'microsoft', 'apple'].includes(provider)) {
        throw new AppError('Invalid OAuth provider', 400);
      }

      if (!providerId || !email) {
        throw new AppError('Provider ID and email are required', 400);
      }

      const userAgent = req.get('user-agent');
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await authService.oauthLogin({
        provider: provider as 'google' | 'microsoft' | 'apple',
        providerId,
        email,
        name,
        avatar,
        userAgent,
        ipAddress,
      });

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          isNewUser: result.isNewUser,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   * Logout user
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;
      const ipAddress = req.ip || req.socket.remoteAddress;

      if (refreshToken) {
        await authService.logout(refreshToken, ipAddress);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout-all
   * Logout from all devices
   */
  async logoutAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const ipAddress = req.ip || req.socket.remoteAddress;

      await authService.logoutAllDevices(userId, ipAddress);

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/verify-email
   * Verify email address with token
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;

      if (!token) {
        throw new AppError('Verification token is required', 400);
      }

      const result = await authService.verifyEmail(token);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/resend-verification
   * Resend email verification
   */
  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      if (!email) {
        throw new AppError('Email is required', 400);
      }

      const result = await authService.resendVerificationEmail(email);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/forgot-password
   * Request password reset
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { error, value } = forgotPasswordSchema.validate(req.body);
      if (error) {
        throw new AppError(error.details[0].message, 400);
      }

      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await authService.requestPasswordReset(value.email, ipAddress);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/reset-password
   * Reset password with token
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { error, value } = resetPasswordSchema.validate(req.body);
      if (error) {
        throw new AppError(error.details[0].message, 400);
      }

      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await authService.resetPassword(
        value.token,
        value.password,
        ipAddress
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/2fa/setup
   * Initialize 2FA setup
   */
  async setup2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const result = await authService.enable2FAInit(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/2fa/verify
   * Verify and activate 2FA
   */
  async verify2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { error, value } = verify2FASchema.validate(req.body);

      if (error) {
        throw new AppError(error.details[0].message, 400);
      }

      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await authService.enable2FAVerify(
        userId,
        value.code,
        ipAddress
      );

      res.status(200).json({
        success: true,
        data: {
          backupCodes: result.backupCodes,
        },
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/2fa/disable
   * Disable 2FA
   */
  async disable2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { error, value } = disable2FASchema.validate(req.body);

      if (error) {
        throw new AppError(error.details[0].message, 400);
      }

      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await authService.disable2FA(
        userId,
        value.password,
        ipAddress
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        throw new AppError('Refresh token not found', 401);
      }

      const result = await authService.refreshAccessToken(refreshToken);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   * Get current user profile
   */
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatar: true,
          emailVerified: true,
          twoFactorEnabled: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/sessions
   * Get all user sessions
   */
  async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const sessions = await authService.getUserSessions(userId);

      res.status(200).json({
        success: true,
        data: { sessions },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/auth/sessions/:sessionId
   * Delete a specific session
   */
  async deleteSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { sessionId } = req.params;

      await authService.deleteSession(sessionId, userId);

      res.status(200).json({
        success: true,
        message: 'Session deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();