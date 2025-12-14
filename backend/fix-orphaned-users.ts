import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixOrphanedUsers() {
  try {
    console.log('\n=== Fixing Orphaned SUPER_ADMIN Users ===\n');
    
    // Get all SUPER_ADMIN users without an accessRole
    const orphanedUsers = await prisma.user.findMany({
      where: {
        role: 'SUPER_ADMIN',
        accessRoleId: null
      }
    });

    console.log(`Found ${orphanedUsers.length} orphaned users without AccessRole\n`);

    for (const user of orphanedUsers) {
      console.log(`User: ${user.name} (${user.email})`);
      
      // Try to find a matching custom role by name
      const matchingRole = await prisma.accessRole.findFirst({
        where: {
          name: {
            contains: user.name.split('(')[0].trim(), // Match first part of name
            mode: 'insensitive'
          },
          isSystem: false
        }
      });

      if (matchingRole) {
        console.log(`  → Found matching role: ${matchingRole.name}`);
        console.log(`  → Linking user to role...`);
        
        await prisma.user.update({
          where: { id: user.id },
          data: { accessRoleId: matchingRole.id }
        });
        
        console.log(`  ✅ Successfully linked!\n`);
      } else {
        console.log(`  ⚠️  No matching custom role found`);
        console.log(`  → Consider creating a role or deleting this user\n`);
      }
    }

    // Show final status
    const remainingOrphaned = await prisma.user.count({
      where: {
        role: 'SUPER_ADMIN',
        accessRoleId: null
      }
    });

    console.log(`\n=== Summary ===`);
    console.log(`Remaining orphaned users: ${remainingOrphaned}`);
    console.log(`Users successfully linked: ${orphanedUsers.length - remainingOrphaned}\n`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOrphanedUsers();
