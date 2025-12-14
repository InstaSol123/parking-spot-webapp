const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  try {
    const users = await prisma.user.count();
    const qrs = await prisma.qRCodeData.count();
    const transactions = await prisma.transaction.count();
    const notifications = await prisma.notification.count();
    const creditLogs = await prisma.creditLog.count();
    const plans = await prisma.plan.count();
    
    console.log('\n📊 Database Status:');
    console.log(`  Users: ${users} (should be 3)`);
    console.log(`  QR Codes: ${qrs} (should be 0)`);
    console.log(`  Transactions: ${transactions} (should be 0)`);
    console.log(`  Notifications: ${notifications} (should be 0)`);
    console.log(`  Credit Logs: ${creditLogs} (should be 0)`);
    console.log(`  Plans: ${plans} (should be 0)`);
    
    const coreUsers = await prisma.user.findMany({
      select: { name: true, email: true, role: true, businessName: true }
    });
    
    console.log('\n👥 Core Users:');
    coreUsers.forEach(u => {
      console.log(`  - ${u.name} (${u.email}) - ${u.role}`);
    });
    
  } finally {
    await prisma.$disconnect();
  }
}

verify();
