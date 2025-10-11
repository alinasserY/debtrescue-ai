import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Main authentication middleware
 * Use this for routes that require authentication
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = verifyToken(token);

    if (payload.type !== 'access') {
      throw new UnauthorizedError('Invalid token type');
    }

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        isActive: true,
        isSuspended: true,
        deletedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.isActive || user.isSuspended || user.deletedAt) {
      throw new UnauthorizedError('Account is not active');
    }

    // Attach user to request
    req.user = {
      userId: user.id,
      email: user.email,
    };

    // Attach session if available (for session revocation)
    if (payload.sessionId) {
      req.session = {
        id: payload.sessionId,
      };
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Alias for backward compatibility
 */
export const authenticate = authMiddleware;

/**
 * Optional authentication - doesn't throw error if no token
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      if (payload.type === 'access') {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { id: true, email: true },
        });

        if (user) {
          req.user = {
            userId: user.id,
            email: user.email,
          };
        }
      }
    }

    next();
  } catch (error) {
    // Don't throw error, just continue without user
    next();
  }
};

/**
 * Middleware to require email verification
 */
export const requireEmailVerified = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { emailVerified: true },
    });

    if (!user?.emailVerified) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email address to continue',
        },
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};