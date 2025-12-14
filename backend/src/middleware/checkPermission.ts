import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../types/index.js';
import { UserRole } from '@prisma/client';

/**
 * Enhanced permission check that considers both UserRole and AccessRole
 * For SUPER_ADMIN users, checks their AccessRole permissions
 * For DISTRIBUTOR/RETAILER users, uses the old role-based logic
 */
export const checkAccess = async (
  req: AuthRequest,
  requiredResource: string,
  requiredAction: string
): Promise<{ allowed: boolean; reason?: string }> => {
  if (!req.user) {
    return { allowed: false, reason: 'Not authenticated' };
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: { accessRole: { include: { permissions: true } } }
  });

  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }

  // For SUPER_ADMIN users, check AccessRole permissions
  if (user.role === UserRole.SUPER_ADMIN) {
    if (!user.accessRole || !user.accessRole.permissions) {
      return { allowed: false, reason: 'No access role assigned' };
    }

    const hasPermission = user.accessRole.permissions.some(
      (perm) => perm.resource === requiredResource && perm.actions.includes(requiredAction)
    );

    if (!hasPermission) {
      return { 
        allowed: false, 
        reason: `Missing ${requiredAction} permission on ${requiredResource}` 
      };
    }

    return { allowed: true };
  }

  // For DISTRIBUTOR/RETAILER, use basic role checks (backward compatibility)
  if (user.role === UserRole.DISTRIBUTOR) {
    const distributorAllowed = ['users', 'financials', 'qrs', 'customers'];
    if (distributorAllowed.includes(requiredResource)) {
      return { allowed: true };
    }
  }

  if (user.role === UserRole.RETAILER) {
    const retailerAllowed = ['qrs', 'customers'];
    if (retailerAllowed.includes(requiredResource)) {
      return { allowed: true };
    }
  }

  return { allowed: false, reason: 'Insufficient permissions' };
};

/**
 * Middleware factory to require specific permissions
 * Usage: router.post('/', requireAccess('users', 'create'), handler)
 */
export const requireAccess = (resource: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { allowed, reason } = await checkAccess(req, resource, action);
    
    if (!allowed) {
      console.log(`[Access Denied] User: ${req.user?.userId}, Resource: ${resource}, Action: ${action}, Reason: ${reason}`);
      return res.status(403).json({ success: false, error: reason || 'Permission denied' });
    }

    next();
  };
};
