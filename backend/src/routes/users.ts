import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest, ApiResponse } from '../types/index.js';
import bcrypt from 'bcryptjs';
import { UserRole, CreditLogType } from '@prisma/client';
import { requireAccess } from '../middleware/checkPermission.js';

const router = Router();

// Get users (with hierarchy support)
router.get('/', requireAccess('users', 'view'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!currentUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    let users: any[] = [];
    let totalCount = 0;
    
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      // Optimized query: single query with proper relationships (no N+1)
      const allUsers = await prisma.user.findMany({
        where: {
          role: { in: [UserRole.DISTRIBUTOR, UserRole.RETAILER] }
        },
        include: {
          credits: true,
          plans: true,
          children: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              partnerId: true,
              createdAt: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });
      
      users = allUsers;
      
      // Get total count in single query
      totalCount = await prisma.user.count({
        where: {
          role: { in: [UserRole.DISTRIBUTOR, UserRole.RETAILER] }
        }
      });
    } else if (currentUser.role === UserRole.DISTRIBUTOR) {
      // Get only direct subordinates
      const result = await prisma.user.findMany({
        where: { parentId: currentUser.id },
        include: { credits: true, plans: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });
      
      users = result;
      
      totalCount = await prisma.user.count({
        where: { parentId: currentUser.id }
      });
    } else {
      users = [];
      totalCount = 0;
    }

    res.json({ 
      success: true, 
      data: users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// Create user
router.post('/', requireAccess('users', 'create'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { name, email, password, businessName, mobile, role, address, aadhaar, pan, gst, msme } = req.body;
    
    // Input validation with detailed error messages
    if (!name || name.trim().length === 0) {
      console.error('[User Create] Validation failed: Name is required');
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.error('[User Create] Validation failed: Invalid email format -', email);
      return res.status(400).json({ success: false, error: 'Valid email is required' });
    }
    if (!password || password.length < 6) {
      console.error('[User Create] Validation failed: Password too short');
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }
    if (!mobile || !/^[0-9]{10,15}$/.test(mobile)) {
      console.error('[User Create] Validation failed: Invalid mobile -', mobile);
      return res.status(400).json({ success: false, error: 'Valid phone number is required (10-15 digits)' });
    }
    if (!role || !['SUPER_ADMIN', 'DISTRIBUTOR', 'RETAILER'].includes(role)) {
      console.error('[User Create] Validation failed: Invalid role -', role);
      return res.status(400).json({ success: false, error: 'Role must be SUPER_ADMIN, DISTRIBUTOR or RETAILER' });
    }
    
    const currentUser = await prisma.user.findUnique({ where: { id: req.user.userId } });

    if (!currentUser || currentUser.role === 'RETAILER') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already exists' });
    }

    // Generate unique partner ID with retry logic
    let partnerId = '';
    let retries = 0;
    const maxRetries = 5;
    let user = null;

    while (retries < maxRetries && !user) {
      try {
        partnerId = Math.floor(10000000 + Math.random() * 90000000).toString();
        const hashedPassword = await bcrypt.hash(password, 10);
        
        let defaultRoleId: string | null = null;
        if (role === 'DISTRIBUTOR') {
          defaultRoleId = (await prisma.accessRole.findFirst({ where: { name: 'Standard Distributor' } }))?.id || null;
        } else if (role === 'RETAILER') {
          defaultRoleId = (await prisma.accessRole.findFirst({ where: { name: 'Standard Retailer' } }))?.id || null;
        }
        // SUPER_ADMIN role will have accessRoleId set to null initially, then updated via update endpoint

        user = await prisma.user.create({
          data: {
            name: name.trim(),
            email: email.toLowerCase(),
            password: hashedPassword,
            businessName: businessName?.trim(),
            mobile,
            partnerId,
            role,
            parentId: role === 'SUPER_ADMIN' ? null : req.user.userId, // Staff accounts have no parent
            accessRoleId: defaultRoleId, // null for SUPER_ADMIN, valid ID for DISTRIBUTOR/RETAILER
            address: address?.trim() || null,
            aadhaar: aadhaar?.trim() || null,
            pan: pan?.trim()?.toUpperCase() || null,
            gst: gst?.trim()?.toUpperCase() || null,
            msme: msme?.trim() || null,
            credits: {
              create: {
                total: 0,
                used: 0,
                available: 0
              }
            }
          },
          include: { credits: true }
        });
      } catch (error: any) {
        // Check for unique constraint violation on partnerId
        if (error.code === 'P2002' && error.meta?.target?.includes('partnerId')) {
          retries++;
          if (retries >= maxRetries) {
            return res.status(500).json({ success: false, error: 'Failed to generate unique partner ID after multiple attempts' });
          }
          continue; // Try again with different ID
        }
        throw error; // Re-throw other errors
      }
    }

    res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    console.error('[User Create] Error creating user:', error.message);
    console.error('[User Create] Error stack:', error.stack);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', requireAccess('users', 'edit'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, businessName, mobile, address, password, aadhaar, pan, gst, msme, paymentDetails, paymentQr, plans, accessRoleId } = req.body;
    
    // Input validation
    if (name !== undefined && (!name || name.toString().trim().length === 0)) {
      return res.status(400).json({ success: false, error: 'Name cannot be empty' });
    }
    if (mobile !== undefined && !/^[0-9]{10,15}$/.test(mobile)) {
      return res.status(400).json({ success: false, error: 'Valid phone number is required (10-15 digits)' });
    }
    if (address !== undefined && address && address.toString().length > 500) {
      return res.status(400).json({ success: false, error: 'Address too long (max 500 characters)' });
    }
    if (businessName !== undefined && businessName && businessName.toString().length > 200) {
      return res.status(400).json({ success: false, error: 'Business name too long (max 200 characters)' });
    }
    
    // Password validation if provided
    if (password !== undefined && password) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
      }
    }

    const updateData: any = {
      ...(name && { name: name.trim() }),
      ...(businessName !== undefined && { businessName: businessName?.trim() || null }),
      ...(mobile && { mobile }),
      ...(address !== undefined && { address: address?.trim() || null }),
      ...(aadhaar !== undefined && { aadhaar: aadhaar?.trim() || null }),
      ...(pan !== undefined && { pan: pan?.trim()?.toUpperCase() || null }),
      ...(gst !== undefined && { gst: gst?.trim()?.toUpperCase() || null }),
      ...(msme !== undefined && { msme: msme?.trim() || null }),
      ...(paymentDetails !== undefined && { paymentDetails }),
      ...(paymentQr !== undefined && { paymentQr }),
      // Note: plans is a relationship and handled separately via nested operations
      // Plans should be updated via the Plan model directly, not through User.update
      ...(accessRoleId !== undefined && { accessRoleId: accessRoleId || null })
    };
    
    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      include: { credits: true }
    });

    res.json({ success: true, data: user });
  } catch (error: any) {
    console.error('[Users PUT] Error updating user:', error.message);
    console.error('[Users PUT] Full error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user', details: error.message });
  }
});

// Grant credits to user (Super Admin or Distributor for their subordinates)
router.post('/:id/grant-credits', async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    // Check if user is Super Admin or Distributor
    const currentUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!currentUser) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    // Super Admin can grant to anyone; Distributor can only grant to their direct subordinates
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      if (currentUser.role !== UserRole.DISTRIBUTOR) {
        return res.status(403).json({ success: false, error: 'Only Super Admins and Distributors can grant credits' });
      }
      // Verify the target user is a direct subordinate
      const targetUser = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (!targetUser || targetUser.parentId !== currentUser.id) {
        return res.status(403).json({ success: false, error: 'You can only grant credits to your direct subordinates' });
      }
    }

    const { amount, reason } = req.body;
    
    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    // Find the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { credits: true }
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check if target user has credits
    if (!targetUser.credits) {
      return res.status(400).json({ success: false, error: 'User credits not initialized' });
    }

    // Update target user's credits
    const updatedCredits = await prisma.credits.update({
      where: { userId: targetUser.id },
      data: {
        total: targetUser.credits.total + amount,
        available: targetUser.credits.available + amount
      }
    });

    // Add credit log for the target user
    await prisma.creditLog.create({
      data: {
        userId: targetUser.id,
        type: CreditLogType.ADD,
        amount,
        reason: reason || 'Granted by Super Admin',
        relatedUserId: currentUser.id,
        relatedUserName: currentUser.name
      }
    });
    console.log(`[GrantCredits] Created ADD log for user ${targetUser.id}`);

    // Add credit log for the Super Admin (GRANT type)
    await prisma.creditLog.create({
      data: {
        userId: currentUser.id,
        type: CreditLogType.GRANT,
        amount,
        reason: `Granted ${amount} credits to ${targetUser.name}`,
        relatedUserId: targetUser.id,
        relatedUserName: targetUser.name
      }
    });
    console.log(`[GrantCredits] Created GRANT log for user ${currentUser.id}`);

    // Return updated user data
    const updatedUser = await prisma.user.findUnique({
      where: { id: targetUser.id },
      include: { credits: true }
    });

    res.json({ 
      success: true, 
      data: updatedUser,
      message: `Successfully granted ${amount} credits to ${targetUser.name}`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to grant credits' });
  }
});

// Get credit history for a user
router.get('/:id/credit-history', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    console.log(`[CreditHistory] Fetching for userId: ${req.params.id}, page: ${pageNum}, limit: ${limitNum}`);

    // Get credit logs for the user
    const creditLogs = await prisma.creditLog.findMany({
      where: { userId: req.params.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum
    });

    console.log(`[CreditHistory] Found ${creditLogs.length} logs for user`);

    // Get total count
    const totalCount = await prisma.creditLog.count({
      where: { userId: req.params.id }
    });

    // Transform createdAt to date string
    const logs = creditLogs.map(log => ({
      ...log,
      date: log.createdAt.toISOString()
    }));

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error: any) {
    console.error('[CreditHistory] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch credit history' });
  }
});

// Get user's child users
router.get('/:id/children', async (req: AuthRequest, res: Response) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const users = await prisma.user.findMany({
      where: { parentId: req.params.id },
      include: { credits: true, activatedQRs: true },
      skip,
      take: limit
    });

    // Get total count
    const totalCount = await prisma.user.count({
      where: { parentId: req.params.id }
    });

    res.json({ 
      success: true, 
      data: users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch child users' });
  }
});

// Get user by ID (MUST be at the end after all specific routes like /credit-history and /children)
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { credits: true, accessRole: { include: { permissions: true } }, children: true, plans: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch user details' });
  }
});

export default router;
