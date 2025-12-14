import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../types/index.js';
import { Logger } from '../utils/logger.js';

/**
 * Middleware to check user permissions
 * Usage: app.post('/api/users', requirePermission('users', 'create'), handler)
 */
export const requirePermission = (resource: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: { accessRole: { include: { permissions: true } } }
      });

      if (!user || !user.accessRole) {
        Logger.warn('User role not found', { userId: req.user.userId });
        return res.status(403).json({ success: false, error: 'Permission denied' });
      }

      // Check if user has permission
      const hasPermission = user.accessRole.permissions.some(
        (perm) => perm.resource === resource && perm.actions.includes(action)
      );

      if (!hasPermission) {
        Logger.warn('Permission denied', {
          userId: req.user.userId,
          resource,
          action,
          path: req.path
        });
        return res.status(403).json({ success: false, error: 'Permission denied' });
      }

      next();
    } catch (error: any) {
      Logger.error('Authorization check failed', { error: error.message });
      res.status(500).json({ success: false, error: 'Authorization check failed' });
    }
  };
};

/**
 * Middleware to require specific role(s)
 * Usage: app.post('/api/users', requireRole(['SUPER_ADMIN']), handler)
 */
export const requireRole = (roles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId }
      });

      if (!user || !roles.includes(user.role)) {
        Logger.warn('Role check failed', {
          userId: req.user.userId,
          requiredRoles: roles,
          userRole: user?.role,
          path: req.path
        });
        return res.status(403).json({ success: false, error: 'Permission denied' });
      }

      next();
    } catch (error: any) {
      Logger.error('Role check failed', { error: error.message });
      res.status(500).json({ success: false, error: 'Authorization check failed' });
    }
  };
};
