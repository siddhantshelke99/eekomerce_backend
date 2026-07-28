import { FastifyReply, FastifyRequest } from 'fastify';
import { ForbiddenError, UnauthorizedError } from '../errors/app-error.js';

export type UserRole = 'CUSTOMER' | 'VENDOR' | 'SUPER_ADMIN';

/**
 * Higher-order middleware function for Role-Based Access Control (RBAC).
 */
export function authorizeRoles(...allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError('User authentication required', 'UNAUTHORIZED');
    }

    const hasRole = allowedRoles.includes(request.user.role as UserRole);
    if (!hasRole) {
      throw new ForbiddenError(
        `User role '${request.user.role}' is not authorized to access this resource`,
        'FORBIDDEN'
      );
    }
  };
}

/**
 * Higher-order middleware function for Granular Permission-Based Access Control (ABAC/PBAC).
 */
export function authorizePermissions(...requiredPermissions: string[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError('User authentication required', 'UNAUTHORIZED');
    }

    // Super Admin retains universal permission override
    if (request.user.role === 'SUPER_ADMIN') {
      return;
    }

    const userPermissions: string[] = (request.user as any).permissions || [];
    const hasPermission = requiredPermissions.every((perm) => userPermissions.includes(perm));

    if (!hasPermission) {
      throw new ForbiddenError(
        `User lacks required permission(s): ${requiredPermissions.join(', ')}`,
        'INSUFFICIENT_PERMISSIONS'
      );
    }
  };
}
