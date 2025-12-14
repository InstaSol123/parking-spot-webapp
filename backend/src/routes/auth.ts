import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { generateToken, authMiddleware } from '../utils/auth.js';
import { AuthRequest, ApiResponse } from '../types/index.js';

const router = Router();

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  businessName?: string;
  mobile: string;
}

// Register
router.post('/register', [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 12 }).withMessage('Password must be at least 12 characters')
    .matches(/[A-Z]/).withMessage('Password must contain uppercase letter (A-Z)')
    .matches(/[a-z]/).withMessage('Password must contain lowercase letter (a-z)')
    .matches(/[0-9]/).withMessage('Password must contain number (0-9)')
    .matches(/[@$!%*?&#^]/).withMessage('Password must contain special character (@$!%*?&#^)'),
  body('mobile').matches(/^[0-9]{10,15}$/).withMessage('Valid mobile number is required (10-15 digits)'),
  body('businessName').optional().trim()
], async (req: any, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { name, email, password, businessName, mobile }: RegisterRequest = req.body;

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
        
        user = await prisma.user.create({
          data: {
            name: name.trim(),
            email: email.toLowerCase(),
            password: hashedPassword,
            businessName: businessName?.trim(),
            mobile,
            partnerId,
            role: 'RETAILER',
            accessRoleId: (await prisma.accessRole.findFirst({ where: { name: 'Standard Retailer' } }))?.id,
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
            return res.status(500).json({ success: false, error: 'Failed to create user - registration service temporarily unavailable' });
          }
          continue; // Try again with different ID
        }
        throw error; // Re-throw other errors
      }
    }

    const token = generateToken(user!.id, user!.email, user!.role);
    res.json({
      success: true,
      data: {
        user: { id: user!.id, name: user!.name, email: user!.email, role: user!.role, partnerId: user!.partnerId },
        token
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req: any, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { email, password }: LoginRequest = req.body;

    const user = await prisma.user.findFirst({
      where: { email },
      include: { credits: true, accessRole: { include: { permissions: true } }, plans: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.email, user.role);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      data: {
        user: userWithoutPassword, // Return complete user object without password
        token
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { credits: true, accessRole: { include: { permissions: true } }, plans: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
