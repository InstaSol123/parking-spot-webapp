import { prisma } from './src/lib/prisma.js';

async function resetCredits() {
  try {
    console.log('Starting credits reset...\n');
    
    // Get the super admin account
    const superAdmin = await prisma.user.findFirst({
      where: { email: 'admin@admin.com' },
      include: { credits: true }
    });
    
    if (!superAdmin) {
      console.error('❌ Super admin account not found');
      process.exit(1);
    }
    
    console.log(`Found Super Admin: ${superAdmin.name} (${superAdmin.email})`);
    
    // Set super admin credits to 2,000,000
    if (superAdmin.credits) {
      await prisma.credits.update({
        where: { userId: superAdmin.id },
        data: {
          total: 2000000,
          available: 2000000,
          used: 0
        }
      });
      console.log(`✓ Super Admin credits set to 2,000,000`);
    } else {
      await prisma.credits.create({
        data: {
          userId: superAdmin.id,
          total: 2000000,
          available: 2000000,
          used: 0
        }
      });
      console.log(`✓ Super Admin credits created: 2,000,000`);
    }
    
    // Get all distributor accounts
    const distributors = await prisma.user.findMany({
      where: { role: 'DISTRIBUTOR' },
      include: { credits: true }
    });
    
    if (distributors.length > 0) {
      for (const distributor of distributors) {
        if (distributor.credits) {
          await prisma.credits.update({
            where: { userId: distributor.id },
            data: {
              total: 0,
              available: 0,
              used: 0
            }
          });
        } else {
          await prisma.credits.create({
            data: {
              userId: distributor.id,
              total: 0,
              available: 0,
              used: 0
            }
          });
        }
      }
      console.log(`✓ Reset ${distributors.length} distributor account(s) to 0 credits`);
    }
    
    // Get all retailer accounts
    const retailers = await prisma.user.findMany({
      where: { role: 'RETAILER' },
      include: { credits: true }
    });
    
    if (retailers.length > 0) {
      for (const retailer of retailers) {
        if (retailer.credits) {
          await prisma.credits.update({
            where: { userId: retailer.id },
            data: {
              total: 0,
              available: 0,
              used: 0
            }
          });
        } else {
          await prisma.credits.create({
            data: {
              userId: retailer.id,
              total: 0,
              available: 0,
              used: 0
            }
          });
        }
      }
      console.log(`✓ Reset ${retailers.length} retailer account(s) to 0 credits`);
    }
    
    // Display final summary
    console.log('\n📊 Credits Reset Summary:');
    console.log(`  Super Admin: 2,000,000 credits`);
    console.log(`  Distributors: 0 credits (${distributors.length} accounts)`);
    console.log(`  Retailers: 0 credits (${retailers.length} accounts)`);
    
    console.log('\n✅ Credits reset completed successfully!');
    
  } catch (error) {
    console.error('❌ Credits reset failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetCredits().catch(console.error);

