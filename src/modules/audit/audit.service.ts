import { PrismaClient, Prisma } from '@prisma/client';

export interface AuditLogOptions {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  constructor(private prisma: PrismaClient) {}

  async log(options: AuditLogOptions) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          userId: options.userId ?? null,
          action: options.action,
          resource: options.resource,
          resourceId: options.resourceId ?? null,
          details: options.details ? (options.details as Prisma.InputJsonValue) : Prisma.DbNull,
          ipAddress: options.ipAddress ?? null,
          userAgent: options.userAgent ?? null,
        },
      });
    } catch (error) {
      console.error('❌ Audit logging failed:', error);
      return null;
    }
  }

  async getAuditLogs(limit = 50, offset = 0) {
    return this.prisma.auditLog.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }
}
