import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../types/index.js';

const router = Router();

// Request credits
router.post('/request', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { amount, txnId } = req.body;
    const currentUser = await prisma.user.findUnique({ where: { id: req.user.userId } });

    if (!currentUser || !currentUser.parentId) {
      return res.status(400).json({ success: false, error: 'User must have a parent to request credits' });
    }

    if (amount < 1) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    const transaction = await prisma.transaction.create({
      data: {
        fromUserId: req.user.userId,
        fromUserName: currentUser.name,
        toUserId: currentUser.parentId,
        amount,
        txnId,
        status: 'PENDING'
      },
      include: { fromUser: true, toUser: true }
    });

    res.status(201).json({ success: true, data: transaction, message: 'Credit request created' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get pending transactions
router.get('/pending', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const transactions = await prisma.transaction.findMany({
      where: {
        toUserId: req.user.userId,
        status: 'PENDING'
      },
      include: { fromUser: true, toUser: true },
      skip,
      take: limit
    });

    // Get total count
    const totalCount = await prisma.transaction.count({
      where: {
        toUserId: req.user.userId,
        status: 'PENDING'
      }
    });

    res.json({ 
      success: true, 
      data: transactions,
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

// Get user's transactions
router.get('/my', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const transactions = await prisma.transaction.findMany({
      where: { fromUserId: req.user.userId },
      include: { fromUser: true, toUser: true },
      skip,
      take: limit
    });

    // Get total count
    const totalCount = await prisma.transaction.count({
      where: { fromUserId: req.user.userId }
    });

    res.json({ 
      success: true, 
      data: transactions,
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

// Approve transaction
router.post('/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: { fromUser: true, toUser: true }
    });

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    if (transaction.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Transaction is not pending' });
    }

    const seller = await prisma.user.findUnique({
      where: { id: transaction.toUserId },
      include: { credits: true }
    });

    if (!seller || !seller.credits) {
      return res.status(400).json({ success: false, error: 'Seller not found' });
    }

    // Validate seller has enough credits (for ALL roles, not just distributor)
    if (seller.credits.available < transaction.amount) {
      return res.status(400).json({ success: false, error: 'Seller has insufficient credits to complete this transaction' });
    }

    // Update seller credits
    let sellerCreditUpdate = { available: seller.credits.available, used: seller.credits.used };
    if (seller.role === 'DISTRIBUTOR') {
      sellerCreditUpdate.available -= transaction.amount;
      sellerCreditUpdate.used += transaction.amount;
    }

    await prisma.credits.update({
      where: { userId: seller.id },
      data: sellerCreditUpdate
    });

    // Add seller credit log
    await prisma.creditLog.create({
      data: {
        userId: seller.id,
        type: 'SUBTRACT',
        amount: transaction.amount,
        reason: `Sold to ${transaction.fromUser.name}`,
        relatedUserId: transaction.fromUserId,
        relatedUserName: transaction.fromUser.name
      }
    });

    // Update buyer credits
    const buyer = await prisma.user.findUnique({
      where: { id: transaction.fromUserId },
      include: { credits: true }
    });

    if (buyer && buyer.credits) {
      await prisma.credits.update({
        where: { userId: buyer.id },
        data: {
          total: buyer.credits.total + transaction.amount,
          available: buyer.credits.available + transaction.amount
        }
      });

      // Add buyer credit log
      await prisma.creditLog.create({
        data: {
          userId: buyer.id,
          type: 'ADD',
          amount: transaction.amount,
          reason: `Purchased from ${seller.name}`,
          relatedUserId: seller.id,
          relatedUserName: seller.name
        }
      });
    }

    // Update transaction
    const updatedTxn = await prisma.transaction.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED' },
      include: { fromUser: true, toUser: true }
    });

    res.json({ success: true, data: updatedTxn, message: 'Transaction approved' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reject transaction
router.post('/:id/reject', async (req: AuthRequest, res: Response) => {
  try {
    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED' },
      include: { fromUser: true, toUser: true }
    });

    res.json({ success: true, data: transaction, message: 'Transaction rejected' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;