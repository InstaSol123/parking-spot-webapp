import { prisma } from './src/lib/prisma';

async function cleanupTestData() {
  try {
    console.log('Starting database cleanup...');
    
    // Get the core user IDs (admin, distributor, retailer)
    const admin = await prisma.user.findFirst({ where: { email: 'admin@admin.com' } });
    const distributor = await prisma.user.findFirst({ where: { email: 'dist@dist.com' } });
    const retailer = await prisma.user.findFirst({ where: { email: 'retailer@ret.com' } });
    
    const coreUserIds = [admin?.id, distributor?.id, retailer?.id].filter(Boolean) as string[];
    
    console.log(`Found ${coreUserIds.length} core user accounts to preserve`);
    
    // Delete all QR codes (all test/sample QR data)
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
      // Delete in order: retailer, distributor, then any others
      for (const user of nonCoreUsers) {
        await prisma.user.delete({
          where: { id: user.id }
        });
      }
      console.log(`✓ Deleted ${nonCoreUsers.length} non-core user accounts`);
    }
    
    // Reset credit values for core users to default
    if (admin?.id) {
      await prisma.credits.upsert({
        where: { userId: admin.id },
        update: { total: 1000, used: 0, available: 1000 },
        create: { userId: admin.id, total: 1000, used: 0, available: 1000 }
      });
      console.log('✓ Reset admin credits to default');
    }
    
    if (distributor?.id) {
      await prisma.credits.upsert({
        where: { userId: distributor.id },
        update: { total: 500, used: 0, available: 500 },
        create: { userId: distributor.id, total: 500, used: 0, available: 500 }
      });
      console.log('✓ Reset distributor credits to default');
    }
    
    if (retailer?.id) {
      await prisma.credits.upsert({
        where: { userId: retailer.id },
        update: { total: 100, used: 0, available: 100 },
        create: { userId: retailer.id, total: 100, used: 0, available: 100 }
      });
      console.log('✓ Reset retailer credits to default');
    }
    
    console.log('\n✅ Database cleanup completed successfully!');
    console.log('\nRemaining core accounts:');
    console.log(`  - Super Admin: admin@admin.com`);
    console.log(`  - Distributor: dist@dist.com`);
    console.log(`  - Retailer: retailer@ret.com`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestData();
