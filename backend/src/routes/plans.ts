import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../types/index.js';
import { requireAccess } from '../middleware/checkPermission.js';

const router = Router();

// Get all plans for a distributor
router.get('/distributor/:distributorId', async (req: AuthRequest, res: Response) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { distributorId: req.params.distributorId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: plans });
  } catch (error: any) {
    console.error('[Plans GET] Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch plans' });
  }
});

// Create a new plan
router.post('/', requireAccess('users', 'create'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { name, credits, price } = req.body;

    // Validate input
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Plan name is required' });
    }
    if (credits === undefined || credits < 1) {
      return res.status(400).json({ success: false, error: 'Credits must be at least 1' });
    }
    if (price === undefined || price < 0) {
      return res.status(400).json({ success: false, error: 'Price cannot be negative' });
    }

    // Create the plan
    const plan = await prisma.plan.create({
      data: {
        name: name.trim(),
        credits: parseInt(credits),
        price: parseInt(price),
        distributorId: req.user.userId
      }
    });

    res.status(201).json({
      success: true,
      data: plan,
      message: 'Plan created successfully'
    });
  } catch (error: any) {
    console.error('[Plans POST] Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to create plan' });
  }
});

// Update a plan
router.put('/:id', requireAccess('users', 'edit'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { name, credits, price } = req.body;

    // Get the plan to verify ownership
    const plan = await prisma.plan.findUnique({
      where: { id: req.params.id }
    });

    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    // Verify the user owns this plan
    if (plan.distributorId !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'You can only update your own plans' });
    }

    // Validate input
    if (name !== undefined && name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Plan name cannot be empty' });
    }
    if (credits !== undefined && credits < 1) {
      return res.status(400).json({ success: false, error: 'Credits must be at least 1' });
    }
    if (price !== undefined && price < 0) {
      return res.status(400).json({ success: false, error: 'Price cannot be negative' });
    }

    // Update the plan
    const updatedPlan = await prisma.plan.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(credits !== undefined && { credits: parseInt(credits) }),
        ...(price !== undefined && { price: parseInt(price) })
      }
    });

    res.json({
      success: true,
      data: updatedPlan,
      message: 'Plan updated successfully'
    });
  } catch (error: any) {
    console.error('[Plans PUT] Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to update plan' });
  }
});

// Delete a plan
router.delete('/:id', requireAccess('users', 'delete'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Get the plan to verify ownership
    const plan = await prisma.plan.findUnique({
      where: { id: req.params.id }
    });

    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    // Verify the user owns this plan
    if (plan.distributorId !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'You can only delete your own plans' });
    }

    // Delete the plan
    await prisma.plan.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error: any) {
    console.error('[Plans DELETE] Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to delete plan' });
  }
});

export default router;
