import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting database seeding...');

    // Check if admin exists
    const adminExists = await prisma.user.findFirst({ 
      where: { email: 'admin@admin.com' } 
    });

    if (adminExists) {
      console.log('✓ Admin already exists, skipping seeding');
      return;
    }

    console.log('Creating roles...');
    
    // Get or create roles
    let superAdminRole = await prisma.accessRole.findFirst({
      where: { name: 'Super Admin' }
    });
    if (!superAdminRole) {
      superAdminRole = await prisma.accessRole.create({
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
    }

    let distributorRole = await prisma.accessRole.findFirst({
      where: { name: 'Standard Distributor' }
    });
    if (!distributorRole) {
      distributorRole = await prisma.accessRole.create({
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
    }

    let retailerRole = await prisma.accessRole.findFirst({
      where: { name: 'Standard Retailer' }
    });
    if (!retailerRole) {
      retailerRole = await prisma.accessRole.create({
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
    }

    console.log('Creating users...');

    // Create Super Admin
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@admin.com',
        mobile: '919999999999',
        password: await bcrypt.hash('admin', 10),
        role: 'SUPER_ADMIN',
        partnerId: '10000001',
        businessName: 'Parking Spot Admin',
        accessRoleId: superAdminRole.id,
        credits: {
          create: {
            total: 1000,
            used: 0,
            available: 1000
          }
        }
      }
    });

    console.log('✓ Admin created');

    // Create Distributor
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
        accessRoleId: distributorRole.id,
        credits: {
          create: {
            total: 500,
            used: 0,
            available: 500
          }
        }
      }
    });

    console.log('✓ Distributor created');

    // Create Retailer
    const retailer = await prisma.user.create({
      data: {
        name: 'Retailer User',
        email: 'retailer@ret.com',
        mobile: '919999999997',
        password: await bcrypt.hash('admin', 10),
        role: 'RETAILER',
        partnerId: '10000003',
        businessName: 'Test Retailer',
        parentId: distributor.id,
        accessRoleId: retailerRole.id,
        credits: {
          create: {
            total: 100,
            used: 0,
            available: 100
          }
        }
      }
    });

    console.log('✓ Retailer created');

    // Create QR codes
    console.log('Creating QR codes...');
    const qrCodes = [];
    for (let i = 1; i <= 10; i++) {
      qrCodes.push({
        code: `QR${Date.now()}${i}`,
        status: i <= 3 ? 'ACTIVATED' : 'AVAILABLE',
        activatedBy: i <= 3 ? retailer.id : null,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      });
    }
    await prisma.qr.createMany({ data: qrCodes });
    console.log(`✓ ${qrCodes.length} QR codes created`);

    // Create customers
    console.log('Creating customers...');
    const customers = [
      { name: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@email.com' },
      { name: 'Priya Singh', phone: '9876543211', email: 'priya@email.com' },
      { name: 'Amit Patel', phone: '9876543212', email: 'amit@email.com' },
      { name: 'Neha Verma', phone: '9876543213', email: 'neha@email.com' },
      { name: 'Vikram Gupta', phone: '9876543214', email: 'vikram@email.com' },
      { name: 'Anjali Sharma', phone: '9876543215', email: 'anjali@email.com' }
    ];
    await prisma.contact.createMany({ data: customers });
    console.log(`✓ ${customers.length} customers created`);

    // Create transactions
    console.log('Creating financial transactions...');
    const transactions = [
      { userId: distributor.id, type: 'CREDIT', amount: 500, status: 'APPROVED', description: 'Initial credits purchased', transactionId: `TXN${Date.now()}1` },
      { userId: distributor.id, type: 'DEBIT', amount: 100, status: 'APPROVED', description: 'Credits used for services', transactionId: `TXN${Date.now()}2` },
      { userId: distributor.id, type: 'CREDIT', amount: 250, status: 'APPROVED', description: 'Bonus credits', transactionId: `TXN${Date.now()}3` },
      { userId: distributor.id, type: 'DEBIT', amount: 75, status: 'APPROVED', description: 'SMS service charges', transactionId: `TXN${Date.now()}4` }
    ];
    await prisma.transaction.createMany({ data: transactions });
    console.log(`✓ ${transactions.length} financial transactions created`);

    console.log('✓ Database seeded successfully!');
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
