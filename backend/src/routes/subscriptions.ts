import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../types/index.js';
import { requireAccess } from '../middleware/checkPermission.js';

const router = Router();

// Get all subscription plans
router.get('/', requireAccess('subscriptions', 'view'), async (req: AuthRequest, res: Response) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany();
    res.json({ success: true, data: plans });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get subscription plan by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: req.params.id }
    });

    if (!plan) {
      return res.status(404).json({ success: false, error: 'Subscription plan not found' });
    }

    res.json({ success: true, data: plan });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create subscription plan (admin only)
router.post('/', requireAccess('subscriptions', 'create'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Only admins can create subscription plans' });
    }

    const { name, type, price, validityDays, description } = req.body;
    if (!name || !type || price === undefined || !validityDays) {
      return res.status(400).json({ success: false, error: 'Missing required fields: name, type, price, validityDays' });
    }

    const plan = await prisma.subscriptionPlan.create({
      data: { name, type, price, validityDays, description: description || '' }
    });

    res.status(201).json({ success: true, data: plan, message: 'Subscription plan created' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update subscription plan (admin only)
router.put('/:id', requireAccess('subscriptions', 'edit'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Only admins can update subscription plans' });
    }

    const { name, type, price, validityDays, description } = req.body;
    const plan = await prisma.subscriptionPlan.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(price !== undefined && { price }),
        ...(validityDays && { validityDays }),
        ...(description && { description })
      }
    });

    res.json({ success: true, data: plan });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete subscription plan (admin only)
router.delete('/:id', requireAccess('subscriptions', 'delete'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Only admins can delete subscription plans' });
    }

    await prisma.subscriptionPlan.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true, message: 'Subscription plan deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
