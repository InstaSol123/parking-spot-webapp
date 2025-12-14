import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: 'SUPER_ADMIN'
      },
      include: { 
        accessRole: { 
          include: { permissions: true } 
        } 
      }
    });

    console.log('\n=== SUPER_ADMIN Users ===\n');
    users.forEach((user, index) => {
      console.log(`${index + 1}. Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   AccessRole: ${user.accessRole?.name || 'None'}`);
      if (user.accessRole) {
        console.log(`   Permissions:`);
        user.accessRole.permissions.forEach(p => {
          console.log(`     - ${p.resource}: ${p.actions}`);
        });
      }
      console.log('');
    });

    console.log(`Total SUPER_ADMIN users: ${users.length}\n`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
