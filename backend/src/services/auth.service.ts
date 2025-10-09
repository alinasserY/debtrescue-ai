import { PrismaClient } from '@prisma/client';
import { 
  hashPassword, 
  comparePassword, 
  validatePasswordStrength 
} from '../utils/password';
import { validateEmail, normalizeEmail } from '../utils/email';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { generateRandomToken, generateBackupCodes, hashBackupCode } from '../utils/crypto';
import { generateTOTPSecret, generateTOTPUri, verifyTOTP } from '../utils/totp';
import { sendVerificationEmail, sendPasswordResetEmail } from './email.service';
import { logger } from '../utils/logger';
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from '../utils/errors';

const prisma = new PrismaClient();

interface SignupData {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}

interface LoginData {
  email: string;
  password: string;
  twoFactorCode?: string;
  userAgent?: string;
  ipAddress?: string;
}

interface OAuthData {
  provider: 'google' | 'microsoft' | 'apple';
  providerId: string;
  email: string;
  name?: string;
  avatar?: string;
  userAgent?: string;
  ipAddress?: string;
}

export class AuthService {
  /**
   * Register a new user with email/password
   */
  async signup(data: SignupData, userAgent?: string, ipAddress?: string) {
    const { email, password, name, phone } = data;

    // Validate and normalize email
    validateEmail(email);
    const normalizedEmail = normalizeEmail(email);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictError('An account with this email already exists');
    }

    // Validate password strength
    validatePasswordStrength(password);

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate email verification token (expires in 24 hours)
    const emailVerificationToken = generateRandomToken();
    const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        hashedPassword,
        name: name?.trim(),
        phone: phone?.trim(),
        emailVerificationToken,
        emailVerificationExpiry,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Create audit log
    await this.createAuditLog({
      userId: user.id,
      action: 'signup',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    // Send verification email (async, non-blocking)
    try {
      await sendVerificationEmail(user.email, emailVerificationToken, user.name);
      logger.info(`Verification email sent for new signup: ${user.email}`, { userId: user.id });
    } catch (error) {
      logger.warn(`Verification email failed during signup: ${user.email}`, { userId: user.id, error: (error as Error).message });
    }

    logger.info(`New user signed up: ${user.email}`, { userId: user.id });

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    // Store refresh token in session
    await this.createSession(user.id, refreshToken, userAgent, ipAddress);

    return {
      user,
      accessToken,
      refreshToken,
      message: 'Account created successfully. Please check your email to verify your account.',
    };
  }

  /**
   * Login with email/password
   */
  async login(data: LoginData) {
    const { email, password, twoFactorCode, userAgent, ipAddress } = data;

    // Normalize email
    const normalizedEmail = normalizeEmail(email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.hashedPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if account is suspended
    if (user.isSuspended) {
      throw new UnauthorizedError(
        `Account suspended. Reason: ${user.suspensionReason || 'Contact support'}`
      );
    }

    // Check if account is locked (too many failed attempts)
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000
      );
      throw new UnauthorizedError(
        `Account locked due to too many failed login attempts. Try again in ${remainingMinutes} minutes.`
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.hashedPassword);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const lockAccount = failedAttempts >= 5;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          lockedUntil: lockAccount ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });

      await this.createAuditLog({
        userId: user.id,
        action: 'login_failed',
        entityType: 'User',
        entityId: user.id,
        ipAddress,
        userAgent,
        metadata: { reason: 'invalid_password', failedAttempts },
      });

      if (lockAccount) {
        throw new UnauthorizedError(
          'Too many failed login attempts. Account locked for 15 minutes.'
        );
      }

      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!twoFactorCode) {
        return {
          requiresTwoFactor: true,
          userId: user.id,
          message: 'Two-factor authentication required',
        };
      }

      const is2FAValid = verifyTOTP(twoFactorCode, user.twoFactorSecret);

      if (!is2FAValid) {
        const isBackupCodeValid = await this.verifyBackupCode(user.id, twoFactorCode);
        
        if (!isBackupCodeValid) {
          await this.createAuditLog({
            userId: user.id,
            action: 'login_failed',
            entityType: 'User',
            entityId: user.id,
            ipAddress,
            userAgent,
            metadata: { reason: 'invalid_2fa' },
          });

          throw new UnauthorizedError('Invalid two-factor authentication code');
        }
      }
    }

    // Reset failed login attempts
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    await this.createAuditLog({
      userId: user.id,
      action: 'login',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    logger.info(`User logged in: ${user.email}`, { userId: user.id });

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    await this.createSession(user.id, refreshToken, userAgent, ipAddress);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      accessToken,
      refreshToken,
    };
  }

  async oauthLogin(data: OAuthData) {
    const { provider, providerId, email, name, avatar, userAgent, ipAddress } = data;

    const normalizedEmail = normalizeEmail(email);
    const providerIdField = `${provider}Id` as 'googleId' | 'microsoftId' | 'appleId';

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { [providerIdField]: providerId },
          { email: normalizedEmail },
        ],
      },
    });

    if (user) {
      if (!user[providerIdField]) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { [providerIdField]: providerId },
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          lastLoginIp: ipAddress,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name,
          avatar,
          [providerIdField]: providerId,
          emailVerified: true,
        },
      });

      logger.info(`New OAuth user created: ${user.email}`, { userId: user.id, provider });
    }

    await this.createAuditLog({
      userId: user.id,
      action: `oauth_login_${provider}`,
      entityType: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    await this.createSession(user.id, refreshToken, userAgent, ipAddress);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      accessToken,
      refreshToken,
      isNewUser: !user.lastLoginAt,
    };
  }

  async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new ValidationError('Invalid verification token');
    }

    if (user.emailVerificationExpiry && user.emailVerificationExpiry < new Date()) {
      throw new ValidationError('Verification token has expired. Please request a new one.');
    }

    if (user.emailVerified) {
      throw new ValidationError('Email already verified');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });

    await this.createAuditLog({
      userId: user.id,
      action: 'email_verified',
      entityType: 'User',
      entityId: user.id,
    });

    logger.info(`Email verified: ${user.email}`, { userId: user.id });

    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string) {
    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return { message: 'If an account exists, a verification email has been sent.' };
    }

    if (user.emailVerified) {
      throw new ValidationError('Email already verified');
    }

    const emailVerificationToken = generateRandomToken();
    const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        emailVerificationToken,
        emailVerificationExpiry,
      },
    });

    try {
      await sendVerificationEmail(user.email, emailVerificationToken, user.name);
      logger.info(`Verification email resent: ${user.email}`, { userId: user.id });
    } catch (error) {
      logger.warn(`Resend verification email failed: ${user.email}`, { userId: user.id, error: (error as Error).message });
    }

    return { message: 'If an account exists, a verification email has been sent.' };
  }

  async requestPasswordReset(email: string, ipAddress?: string) {
    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    const passwordResetToken = generateRandomToken();
    const passwordResetExpiry = new Date(Date.now() + 3600000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpiry,
      },
    });

    await this.createAuditLog({
      userId: user.id,
      action: 'password_reset_requested',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
    });

    try {
      await sendPasswordResetEmail(user.email, passwordResetToken);
      logger.info(`Password reset email sent: ${user.email}`, { userId: user.id });
    } catch (error) {
      logger.warn(`Password reset email failed: ${user.email}`, { userId: user.id, error: (error as Error).message });
    }

    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string, ipAddress?: string) {
    const user = await prisma.user.findFirst({
      where: { 
        passwordResetToken: token,
        passwordResetExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new ValidationError('Invalid or expired reset token');
    }

    validatePasswordStrength(newPassword);

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    await this.createAuditLog({
      userId: user.id,
      action: 'password_reset',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
    });

    logger.info(`Password reset: ${user.email}`, { userId: user.id });

    return { message: 'Password reset successfully. Please log in with your new password.' };
  }

  async enable2FAInit(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, twoFactorEnabled: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new ValidationError('Two-factor authentication is already enabled');
    }

    const secret = generateTOTPSecret();
    const otpauthUrl = generateTOTPUri(user.email, secret);

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    return {
      secret,
      qrCodeUrl: otpauthUrl,
      message: 'Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)',
    };
  }

  async enable2FAVerify(userId: string, code: string, ipAddress?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        twoFactorSecret: true, 
        twoFactorEnabled: true 
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new ValidationError('Two-factor authentication is already enabled');
    }

    if (!user.twoFactorSecret) {
      throw new ValidationError('Two-factor setup not initiated. Please start the setup process first.');
    }

    const isValid = verifyTOTP(code, user.twoFactorSecret);

    if (!isValid) {
      throw new ValidationError('Invalid verification code');
    }

    const backupCodes = generateBackupCodes(10);
    const hashedBackupCodes = backupCodes.map(code => hashBackupCode(code));

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        backupCodes: hashedBackupCodes,
      },
    });

    await this.createAuditLog({
      userId: user.id,
      action: '2fa_enabled',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
    });

    logger.info(`2FA enabled: ${user.email}`, { userId: user.id });

    return {
      backupCodes,
      message: 'Two-factor authentication enabled successfully. Save your backup codes in a safe place.',
    };
  }

  async disable2FA(userId: string, password: string, ipAddress?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new ValidationError('Two-factor authentication is not enabled');
    }

    if (!user.hashedPassword) {
      throw new ValidationError('Cannot disable 2FA for OAuth-only accounts');
    }

    const isPasswordValid = await comparePassword(password, user.hashedPassword);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid password');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: [],
      },
    });

    await this.createAuditLog({
      userId: user.id,
      action: '2fa_disabled',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
    });

    logger.info(`2FA disabled: ${user.email}`, { userId: user.id });

    return { message: 'Two-factor authentication disabled' };
  }

  private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { backupCodes: true },
    });

    if (!user || user.backupCodes.length === 0) {
      return false;
    }

    const hashedCode = hashBackupCode(code);
    const codeIndex = user.backupCodes.indexOf(hashedCode);

    if (codeIndex === -1) {
      return false;
    }

    const updatedCodes = user.backupCodes.filter((_, index) => index !== codeIndex);

    await prisma.user.update({
      where: { id: userId },
      data: { backupCodes: updatedCodes },
    });

    logger.info(`Backup code used`, { userId });

    return true;
  }

  async refreshAccessToken(refreshToken: string) {
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({
        where: { id: session.id },
      });
      throw new UnauthorizedError('Refresh token expired');
    }

    if (session.user.isSuspended || session.user.deletedAt) {
      throw new UnauthorizedError('Account is no longer active');
    }

    const accessToken = generateAccessToken(session.user.id, session.user.email);

    await prisma.session.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

    return { accessToken };
  }

  async logout(refreshToken: string, ipAddress?: string) {
    const session = await prisma.session.findUnique({
      where: { refreshToken },
    });

    if (session) {
      await prisma.session.delete({
        where: { id: session.id },
      });

      await this.createAuditLog({
        userId: session.userId,
        action: 'logout',
        entityType: 'Session',
        entityId: session.id,
        ipAddress,
      });

      logger.info('User logged out', { userId: session.userId });
    }

    return { message: 'Logged out successfully' };
  }

  async logoutAllDevices(userId: string, ipAddress?: string) {
    await prisma.session.deleteMany({
      where: { userId },
    });

    await this.createAuditLog({
      userId,
      action: 'logout_all_devices',
      entityType: 'User',
      entityId: userId,
      ipAddress,
    });

    logger.info('User logged out from all devices', { userId });

    return { message: 'Logged out from all devices successfully' };
  }

  async getUserSessions(userId: string) {
    const sessions = await prisma.session.findMany({
      where: { userId },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
      orderBy: { lastUsedAt: 'desc' },
    });

    return sessions;
  }

  async deleteSession(sessionId: string, userId: string) {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    await prisma.session.delete({
      where: { id: sessionId },
    });

    return { message: 'Session deleted successfully' };
  }

  private async createSession(
    userId: string,
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string
  ) {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return prisma.session.create({
      data: {
        userId,
        refreshToken,
        userAgent: userAgent || 'Unknown',
        ipAddress: ipAddress || 'Unknown',
        expiresAt,
      },
    });
  }

  private async createAuditLog(data: {
    userId?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          metadata: data.metadata,
        },
      });
    } catch (error) {
      logger.error('Failed to create audit log', { error, data });
    }
  }
}

export const authService = new AuthService();