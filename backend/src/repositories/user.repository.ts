import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

export class UserRepository {
  async findById(userId: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sessions: {
          where: {
            expiresAt: {
              gt: new Date(),
            },
            isRevoked: false,
          },
          orderBy: {
            lastUsedAt: 'desc',
          },
          take: 5,
        },
      },
    });
  }

  async updateNotificationPreferences(
    userId: string,
    data: {
      marketingEmails?: boolean;
      productUpdates?: boolean;
      weeklyDigest?: boolean;
    }
  ): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase().trim();
    return await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      phone?: string | null;
      avatar?: string | null;
      company?: string | null;
      jobTitle?: string | null;
      website?: string | null;
      bio?: string | null;
      location?: string | null;
      timezone?: string | null;
      addressLine1?: string | null;
      addressLine2?: string | null;
      city?: string | null;
      state?: string | null;
      zipCode?: string | null;
      country?: string | null;
    }
  ): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        hashedPassword,
        updatedAt: new Date(),
      },
    });
  }

  async getActivityLogs(userId: string, limit: number = 20) {
    return await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        action: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        metadata: true,
      },
    });
  }

  async getActiveSessions(userId: string) {
    return await prisma.session.findMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
        isRevoked: false,
      },
      orderBy: {
        lastUsedAt: 'desc',
      },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
    });
  }

  async revokeSession(sessionId: string, userId: string): Promise<void> {
    await prisma.session.update({
      where: {
        id: sessionId,
        userId,
      },
      data: {
        isRevoked: true,
        updatedAt: new Date(),
      },
    });
  }

  async revokeAllSessionsExcept(userId: string, currentSessionId: string): Promise<number> {
    const result = await prisma.session.updateMany({
      where: {
        userId,
        id: {
          not: currentSessionId,
        },
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        updatedAt: new Date(),
      },
    });
    return result.count;
  }

  async softDelete(userId: string): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        isActive: false,
        email: `deleted_${userId}@deleted.com`,
      },
    });
  }

  async exists(userId: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { id: userId },
    });
    return count > 0;
  }
}

export const userRepository = new UserRepository();