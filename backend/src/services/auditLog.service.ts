import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// AUDIT LOG SERVICE
// ============================================

interface AuditLogData {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

export class AuditLogService {
  async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId || null,
          action: data.action,
          entityType: data.entityType || null,
          entityId: data.entityId || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
          metadata: data.metadata || null,
        },
      });
    } catch (error) {
      // Don't throw error, just log it
      console.error('Failed to create audit log:', error);
    }
  }
}

export const auditLogService = new AuditLogService();