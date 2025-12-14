import { prisma } from './src/lib/prisma.js';

async function cleanupAllData() {
  try {
    console.log('Starting comprehensive data cleanup...\n');
    
    // Get the core user IDs (admin, distributor, retailer)
    const admin = await prisma.user.findFirst({ where: { email: 'admin@admin.com' } });
    const distributor = await prisma.user.findFirst({ where: { email: 'dist@dist.com' } });
    const retailer = await prisma.user.findFirst({ where: { email: 'retailer@ret.com' } });
    
    const coreUserIds = [admin?.id, distributor?.id, retailer?.id].filter(Boolean) as string[];
    
    console.log(`Found ${coreUserIds.length} core user accounts to preserve\n`);
    
    // Delete all QR codes
    const qrCount = await prisma.qRCodeData.count();
    if (qrCount > 0) {
      await prisma.qRCodeData.deleteMany({});
      console.log(`✓ Deleted ${qrCount} QR code records`);
    }
    
    // Delete all transactions
    const transactionCount = await prisma.transaction.count();
    if (transactionCount > 0) {
      await prisma.transaction.deleteMany({});
      console.log(`✓ Deleted ${transactionCount} transaction records`);
    }
    
    // Delete all notifications
    const notificationCount = await prisma.notification.count();
    if (notificationCount > 0) {
      await prisma.notification.deleteMany({});
      console.log(`✓ Deleted ${notificationCount} notification records`);
    }
    
    // Delete all credit logs
    const creditLogCount = await prisma.creditLog.count();
    if (creditLogCount > 0) {
      await prisma.creditLog.deleteMany({});
      console.log(`✓ Deleted ${creditLogCount} credit log records`);
    }
    
    // Delete all plans (distributor-specific)
    const planCount = await prisma.plan.count();
    if (planCount > 0) {
      await prisma.plan.deleteMany({});
      console.log(`✓ Deleted ${planCount} plan records`);
    }
    
    // Delete any non-core users
    const nonCoreUsers = await prisma.user.findMany({
      where: {
        id: {
          notIn: coreUserIds
        }
      }
    });
    
    if (nonCoreUsers.length > 0) {
      for (const user of nonCoreUsers) {
        await prisma.user.delete({
          where: { id: user.id }
        });
      }
      console.log(`✓ Deleted ${nonCoreUsers.length} non-core user accounts`);
    }
    
    // Reset credit values for core users
    if (admin?.id) {
      await prisma.credits.upsert({
        where: { userId: admin.id },
        update: { total: 2000000, available: 2000000, used: 0 },
        create: { userId: admin.id, total: 2000000, available: 2000000, used: 0 }
      });
      console.log('✓ Reset admin credits to 2,000,000');
    }
    
    if (distributor?.id) {
      await prisma.credits.upsert({
        where: { userId: distributor.id },
        update: { total: 0, available: 0, used: 0 },
        create: { userId: distributor.id, total: 0, available: 0, used: 0 }
      });
      console.log('✓ Reset distributor credits to 0');
    }
    
    if (retailer?.id) {
      await prisma.credits.upsert({
        where: { userId: retailer.id },
        update: { total: 0, available: 0, used: 0 },
        create: { userId: retailer.id, total: 0, available: 0, used: 0 }
      });
      console.log('✓ Reset retailer credits to 0');
    }
    
    console.log('\n📊 Final Status:');
    console.log(`  Total Users: 3 (core accounts only)`);
    console.log(`  QR Codes: 0`);
    console.log(`  Transactions: 0`);
    console.log(`  Notifications: 0`);
    console.log(`  Credit Logs: 0`);
    console.log(`  Plans: 0`);
    
    console.log('\n✅ Comprehensive cleanup completed successfully!');
    console.log('\nCore accounts ready for fresh testing:');
    console.log(`  - Super Admin: admin@admin.com (2,000,000 credits)`);
    console.log(`  - Distributor: dist@dist.com (0 credits)`);
    console.log(`  - Retailer: retailer@ret.com (0 credits)`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupAllData().catch(console.error);

