import 'express-async-errors';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { prisma } from './lib/prisma.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import qrRoutes from './routes/qrs.js';
import transactionRoutes from './routes/transactions.js';
import notificationRoutes from './routes/notifications.js';
import roleRoutes from './routes/roles.js';
import settingsRoutes from './routes/settings.js';
import subscriptionRoutes from './routes/subscriptions.js';
import planRoutes from './routes/plans.js';
import { authMiddleware } from './utils/auth.js';
import { ApiResponse } from './types/index.js';
import { sanitizeBody } from './utils/sanitizer.js';
import { Logger } from './utils/logger.js';



dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Rate limiting TEMPORARILY DISABLED FOR TESTING
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 10000,
//   message: 'Too many authentication attempts, please try again later',
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 2000,
//   message: 'Too many requests, please try again later',
//   standardHeaders: true,
//   legacyHeaders: false,
//   skip: (req) => {
//     return req.path === '/health';
//   }
// });

// Rate limiting temporarily disabled for testing
// app.use('/api/auth', authLimiter);
// app.use('/api/', (req, res, next) => {
//   if (req.path.startsWith('/auth')) {
//     return next();
//   }
//   apiLimiter(req, res, next);
// });

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow production domain
    const allowedOrigins = [FRONTEND_URL, 'https://qr.mytesting.cloud', 'http://qr.mytesting.cloud'];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (NODE_ENV === 'development') {
      // In development, allow any origin
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Add input sanitization middleware
app.use(sanitizeBody);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Add request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log the request when it completes
  res.on('finish', () => {
    const duration = Date.now() - start;
    Logger.logRequest(req.method, req.originalUrl, res.statusCode, duration);
  });
  
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Backend is running' });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/plans', authMiddleware, planRoutes);
app.use('/api/qrs', authMiddleware, qrRoutes);
app.use('/api/transactions', authMiddleware, transactionRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/roles', authMiddleware, roleRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);
app.use('/api/subscriptions', authMiddleware, subscriptionRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  Logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path, method: req.method });
  
  // Don't leak error details in production
  const message = NODE_ENV === 'production' ? 'Internal server error' : err.message;
  const status = err.status || 500;
  
  const response: ApiResponse<null> = {
    success: false,
    error: message,
    // Include stack trace only in development
    ...(NODE_ENV === 'development' && { stack: err.stack })
  };
  
  res.status(status).json(response);
});

// 404 handler
app.use((req: Request, res: Response) => {
  Logger.warn('Route not found', { method: req.method, url: req.originalUrl });
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Initialize database and start server
async function main() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    Logger.info('Database connected');
    
    // Seed default data if needed
    await seedDatabase();
    
    app.listen(PORT, () => {
      Logger.info(`Server running on port ${PORT}`, { frontendUrl: FRONTEND_URL });
    });
  } catch (error) {
    Logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
}

async function seedDatabase() {
  try {
    // Check if default roles exist
    const adminRole = await prisma.accessRole.findFirst({
      where: { name: 'Super Admin' }
    });

    if (!adminRole) {
      console.log('Creating default roles...');

      // Create system roles
      const superAdminRole = await prisma.accessRole.create({
        data: {
          name: 'Super Admin',
          description: 'Full access to all resources',
          isSystem: true,
          permissions: {
            create: [
              { resource: 'users', actions: 'view,create,edit,delete' },
              { resource: 'qrs', actions: 'view,create,edit,delete' },
              { resource: 'settings', actions: 'view,create,edit,delete' },
              { resource: 'roles', actions: 'view,create,edit,delete' },
              { resource: 'financials', actions: 'view,create,edit,delete' },
              { resource: 'customers', actions: 'view,create,edit,delete' },
              { resource: 'subscriptions', actions: 'view,create,edit,delete' }
            ]
          }
        }
      });

      const distributorRole = await prisma.accessRole.create({
        data: {
          name: 'Standard Distributor',
          description: 'Can manage retailers and sales',
          isSystem: true,
          permissions: {
            create: [
              { resource: 'users', actions: 'view,create,edit' },
              { resource: 'financials', actions: 'view,create' }
            ]
          }
        }
      });

      const retailerRole = await prisma.accessRole.create({
        data: {
          name: 'Standard Retailer',
          description: 'Can activate QRs',
          isSystem: true,
          permissions: {
            create: [
              { resource: 'qrs', actions: 'view,edit' }
            ]
          }
        }
      });

      console.log('✓ Default roles created');
    }

    // Check if default users exist
    const adminUser = await prisma.user.findFirst({ where: { email: 'admin@admin.com' } });
    if (!adminUser) {
      console.log('Creating default users...');
      
      // Get the Super Admin role that was created earlier
      const superAdminRole = await prisma.accessRole.findFirst({
        where: { name: 'Super Admin' }
      });

      const distributorRole = await prisma.accessRole.findFirst({
        where: { name: 'Standard Distributor' }
      });

      const retailerRole = await prisma.accessRole.findFirst({
        where: { name: 'Standard Retailer' }
      });
      
      // Create admin user with Super Admin role
      const admin = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@admin.com',
          mobile: '919999999999',
          password: await bcrypt.hash('admin', 10),
          role: 'SUPER_ADMIN',
          partnerId: '10000001',
          businessName: 'Parking Spot Admin',
          accessRoleId: superAdminRole?.id,
          credits: {
            create: {
              total: 1000,
              used: 0,
              available: 1000
            }
          }
        },
        include: { credits: true }
      });

      // Create distributor user with admin as parent
      const distributor = await prisma.user.create({
        data: {
          name: 'Distributor User',
          email: 'dist@dist.com',
          mobile: '919999999998',
          password: await bcrypt.hash('admin', 10),
          role: 'DISTRIBUTOR',
          partnerId: '10000002',
          businessName: 'Test Distributor',
          parentId: admin.id,
          accessRoleId: distributorRole?.id,
          credits: {
            create: {
              total: 500,
              used: 0,
              available: 500
            }
          }
        },
        include: { credits: true }
      });

      // Create retailer user with distributor as parent
      await prisma.user.create({
        data: {
          name: 'Retailer User',
          email: 'retailer@ret.com',
          mobile: '919999999997',
          password: await bcrypt.hash('admin', 10),
          role: 'RETAILER',
          partnerId: '10000003',
          businessName: 'Test Retailer',
          parentId: distributor.id,
          accessRoleId: retailerRole?.id,
          credits: {
            create: {
              total: 100,
              used: 0,
              available: 100
            }
          }
        },
        include: { credits: true }
      });

      console.log('✓ Default users created with roles and hierarchy');

      // Create sample QR codes for retailer
      const retailer = await prisma.user.findFirst({ where: { email: 'retailer@ret.com' } });
      if (retailer) {
        console.log('Creating sample QR codes...');
        const qrCodes: any[] = [];
        for (let i = 1; i <= 10; i++) {
          qrCodes.push({
            code: `QR${Date.now()}${i}`,
            serialNumber: `SR${String(i).padStart(6, '0')}`,
            status: i <= 3 ? 'ACTIVE' : 'UNUSED'
          });
        }
        await prisma.qRCodeData.createMany({ data: qrCodes });
        console.log('✓ Sample QR codes created');
      }

      // Create sample customers/contacts
      console.log('Creating sample customers...');
      const existingContacts = await prisma.qRCodeData.count();
      if (existingContacts < 10) {
        const customers = [
          { name: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@email.com' },
          { name: 'Priya Singh', phone: '9876543211', email: 'priya@email.com' },
          { name: 'Amit Patel', phone: '9876543212', email: 'amit@email.com' },
          { name: 'Neha Verma', phone: '9876543213', email: 'neha@email.com' },
          { name: 'Vikram Gupta', phone: '9876543214', email: 'vikram@email.com' },
          { name: 'Anjali Sharma', phone: '9876543215', email: 'anjali@email.com' }
        ];
        // Note: There's no Contact model in the schema, skipping this for now
        console.log('⚠ Skipping customer creation - no Contact model in schema');
      }

      // Create sample financial transactions
      console.log('Creating sample financial transactions...');
      const distUser = await prisma.user.findFirst({ where: { email: 'dist@dist.com' } });
      if (distUser) {
        // Skip transaction creation for now as the schema has changed
        console.log('⚠ Skipping transaction creation - schema mismatch');
      }
    }

    // Check if default subscription plans exist
    const plans = await prisma.subscriptionPlan.count();
    if (plans === 0) {
      console.log('Creating default subscription plans...');
      await prisma.subscriptionPlan.createMany({
        data: [
          {
            name: 'Standard Free',
            type: 'FREE',
            price: 0,
            validityDays: 3650,
            description: 'Basic QR functionality with direct calling.'
          },
          {
            name: 'Gold Privacy (1 Year)',
            type: 'PAID_MASKED',
            price: 499,
            validityDays: 365,
            description: 'Masked calling and SMS for privacy.'
          }
        ]
      });
      console.log('✓ Default subscription plans created');
    }

    // Check if default settings exist
    const settings = await prisma.systemSettings.count();
    if (settings === 0) {
      console.log('Creating default system settings...');
      await prisma.systemSettings.create({
        data: {
          adminPaymentInfo: 'UPI ID: admin@upi | Scan to Pay',
          supportEmail: 'support@parkingspot.in',
          supportPhone: '919999999999'
        }
      });
      console.log('✓ Default system settings created');
    }

    // Check if default SMS templates exist
    const templates = await prisma.sMSTemplate.count();
    if (templates === 0) {
      console.log('Creating default SMS templates...');
      await prisma.sMSTemplate.createMany({
        data: [
          { text: 'Your car lights are ON.' },
          { text: 'Your vehicle is blocking mine.' },
          { text: 'Window is open.' },
          { text: 'Emergency near your car.' }
        ]
      });
      console.log('✓ Default SMS templates created');
    }
  } catch (error) {
    console.error('Seeding error:', error);
  }
}

main().catch(console.error);

export default app;
