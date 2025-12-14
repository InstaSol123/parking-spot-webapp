import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugTestUser() {
  try {
    console.log('\n=== Debugging Test User ===\n');
    
    // Find test users
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'testmanager'
        }
      },
      include: {
        accessRole: {
          include: {
            permissions: true
          }
        }
      }
    });

    console.log(`Found ${testUsers.length} test users:\n`);

    for (const user of testUsers) {
      console.log(`User: ${user.email}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Base Role: ${user.role}`);
      console.log(`  AccessRole ID: ${user.accessRoleId}`);
      console.log(`  AccessRole Name: ${user.accessRole?.name}`);
      
      if (user.accessRole && user.accessRole.permissions) {
        console.log(`  Permissions:`);
        user.accessRole.permissions.forEach(p => {
          console.log(`    - ${p.resource}: ${p.actions}`);
        });
      } else {
        console.log(`  Permissions: NONE (No AccessRole)`);
      }
      console.log();
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTestUser();
