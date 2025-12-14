import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../types/index.js';
import { $Enums } from '@prisma/client';
import { requireAccess } from '../middleware/checkPermission.js';

const router = Router();

// Get notifications for current user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { targetRole: 'ALL' },
          { targetRole: user.role }
        ]
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    // Get total count
    const totalCount = await prisma.notification.count({
      where: {
        OR: [
          { targetRole: 'ALL' },
          { targetRole: user.role }
        ]
      }
    });

    res.json({ 
      success: true, 
      data: notifications,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create notification (admin only)
router.post('/', requireAccess('notifications', 'create'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!currentUser || currentUser.role !== $Enums.UserRole.SUPER_ADMIN) {
      return res.status(403).json({ success: false, error: 'Only super admins can create notifications' });
    }

    const { title, message, targetRole } = req.body;
    if (!title || !message || !targetRole) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const notification = await prisma.notification.create({
      data: { title, message, targetRole }
    });

    res.status(201).json({ success: true, data: notification, message: 'Notification created' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete notification (admin only)
router.delete('/:id', requireAccess('notifications', 'delete'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!currentUser || currentUser.role !== $Enums.UserRole.SUPER_ADMIN) {
      return res.status(403).json({ success: false, error: 'Only super admins can delete notifications' });
    }

    await prisma.notification.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;