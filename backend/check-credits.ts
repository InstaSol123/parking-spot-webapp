import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCredits() {
  try {
    const logs = await prisma.creditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('Recent credit logs:');
    logs.forEach(log => {
      console.log(`- ${log.type}: ${log.amount} (${log.reason})`);
    });
    
    const totalLogs = await prisma.creditLog.count();
    console.log('\nTotal credit logs in database:', totalLogs);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCredits();
