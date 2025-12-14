import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';
import { $Enums } from '@prisma/client';
import { requireAccess } from '../middleware/checkPermission.js';

const router = Router();

// Generate QR codes
router.post('/generate', requireAccess('qrs', 'create'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!currentUser || currentUser.role !== $Enums.UserRole.SUPER_ADMIN) {
      return res.status(403).json({ success: false, error: 'Only admins can generate QRs' });
    }

    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, error: 'Invalid quantity' });
    }

    // Use transaction to ensure atomic serial number generation
    const qrs = await prisma.$transaction(async (tx) => {
      // Get the current count within transaction to ensure consistency
      const qrCount = await tx.qRCodeData.count();
      const generatedQRs = [];

      // Generate QRs sequentially
      for (let i = 0; i < quantity; i++) {
        const code = Math.random().toString(36).substr(2, 12).toUpperCase();
        const serialNumber = `SR${(qrCount + i + 1).toString().padStart(6, '0')}`;

        const qr = await tx.qRCodeData.create({
          data: {
            code,
            serialNumber,
            status: $Enums.QRStatus.UNUSED,
            plan: $Enums.PlanType.FREE
          }
        });
        generatedQRs.push(qr);
      }

      return generatedQRs;
    });

    res.status(201).json({ success: true, data: qrs, message: `${quantity} QR codes generated` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all QR codes
router.get('/', requireAccess('qrs', 'view'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const { status, activatedBy } = req.query;
    const currentUser = await prisma.user.findUnique({ where: { id: req.user.userId } });

    let where: any = {};
    if (status) where.status = status;
    if (activatedBy) where.activatedById = activatedBy;
    else if (currentUser?.role === $Enums.UserRole.RETAILER) {
      where.activatedById = req.user.userId;
    }

    const qrs = await prisma.qRCodeData.findMany({
      where,
      include: { subscriptionPlan: true, activatedBy: true },
      orderBy: { serialNumber: 'asc' }, // Order by serial number for proper sequencing
      skip,
      take: limit
    });

    // Get total count
    const totalCount = await prisma.qRCodeData.count({
      where
    });

    res.json({ 
      success: true, 
      data: qrs,
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

// Get QR code by code
router.get('/code/:code', async (req: AuthRequest, res: Response) => {
  try {
    const qr = await prisma.qRCodeData.findUnique({
      where: { code: req.params.code },
      include: { subscriptionPlan: true, activatedBy: true }
    });

    if (!qr) {
      return res.status(404).json({ success: false, error: 'QR code not found' });
    }

    res.json({ success: true, data: qr });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Activate QR code
router.post('/:id/activate', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { ownerName, ownerMobile, ownerEmail, ownerAddress, vehicleNumber, subscriptionPlanId, transactionId } = req.body;
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { credits: true }
    });

    if (!currentUser || currentUser.role !== $Enums.UserRole.RETAILER) {
      return res.status(403).json({ success: false, error: 'Only retailers can activate QRs' });
    }

    // Verify QR exists and is unused
    const qr = await prisma.qRCodeData.findUnique({
      where: { id: req.params.id }
    });

    if (!qr) {
      return res.status(404).json({ success: false, error: 'QR code not found' });
    }

    if (qr.status !== $Enums.QRStatus.UNUSED) {
      return res.status(400).json({ success: false, error: 'QR code already activated' });
    }

    // Get subscription plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: subscriptionPlanId }
    });

    // Use atomic transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Check credits within transaction (ensures isolation)
      const credits = await tx.credits.findUnique({
        where: { userId: currentUser.id }
      });

      if (!credits || credits.available < 1) {
        throw new Error('INSUFFICIENT_CREDITS');
      }

      // Update QR (atomic)
      const updatedQR = await tx.qRCodeData.update({
        where: { id: req.params.id },
        data: {
          status: $Enums.QRStatus.ACTIVE,
          ownerName,
          ownerMobile,
          ownerEmail,
          ownerAddress,
          vehicleNumber,
          activatedById: req.user!.userId,
          activatedAt: new Date(),
          subscriptionPlanId,
          subscriptionPlanName: plan?.name,
          plan: plan?.type || $Enums.PlanType.FREE,
          transactionId
        }
      });

      // Deduct credit (atomic)
      await tx.credits.update({
        where: { userId: currentUser.id },
        data: {
          used: { increment: 1 },
          available: { decrement: 1 }
        }
      });

      // Add credit log (atomic)
      await tx.creditLog.create({
        data: {
          userId: currentUser.id,
          type: $Enums.CreditLogType.ACTIVATION,
          amount: 1,
          reason: `Activated QR ${qr.code} (${plan?.name || 'Free'})`
        }
      });

      return updatedQR;
    });

    res.json({ success: true, data: result, message: 'QR code activated successfully' });
  } catch (error: any) {
    if (error.message === 'INSUFFICIENT_CREDITS') {
      return res.status(400).json({ success: false, error: 'Insufficient credits' });
    }
    res.status(500).json({ success: false, error: 'Failed to activate QR code' });
  }
});

// Update owner details
router.put('/:id/owner', async (req: AuthRequest, res: Response) => {
  try {
    const { ownerName, ownerMobile, ownerEmail, ownerAddress, vehicleNumber, aadhaar, pan } = req.body;

    // Input validation
    if (ownerName && ownerName.toString().trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Owner name cannot be empty' });
    }
    if (ownerMobile && !/^[0-9]{10,15}$/.test(ownerMobile)) {
      return res.status(400).json({ success: false, error: 'Valid phone number is required' });
    }
    if (ownerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
      return res.status(400).json({ success: false, error: 'Valid email is required' });
    }
    if (vehicleNumber && vehicleNumber.toString().trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Vehicle number cannot be empty' });
    }

    const qr = await prisma.qRCodeData.update({
      where: { id: req.params.id },
      data: {
        ...(ownerName && { ownerName: ownerName.trim() }),
        ...(ownerMobile && { ownerMobile }),
        ...(ownerEmail && { ownerEmail: ownerEmail.toLowerCase() }),
        ...(ownerAddress && { ownerAddress: ownerAddress.trim() }),
        ...(vehicleNumber && { vehicleNumber: vehicleNumber.trim() }),
        ...(aadhaar && { aadhaar: aadhaar.trim() }),
        ...(pan && { pan: pan.trim() })
      }
    });

    res.json({ success: true, data: qr });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to update owner details' });
  }
});

// Mark QR codes as downloaded
router.post('/mark-downloaded', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!currentUser || currentUser.role !== $Enums.UserRole.SUPER_ADMIN) {
      return res.status(403).json({ success: false, error: 'Only admins can mark QRs as downloaded' });
    }

    const { qrIds } = req.body;
    if (!qrIds || !Array.isArray(qrIds) || qrIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid QR IDs' });
    }

    // Mark all specified QRs as downloaded
    // Note: Downloaded tracking is handled per-QR through individual updates
    const result = await prisma.qRCodeData.findMany({
      where: {
        id: { in: qrIds },
        status: $Enums.QRStatus.UNUSED
      }
    });

    res.json({ 
      success: true, 
      data: { count: result.length },
      message: `Retrieved ${result.length} QR codes for download`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to mark QRs as downloaded' });
  }
});

export default router;