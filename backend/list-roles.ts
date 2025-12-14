import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listRoles() {
  try {
    const roles = await prisma.accessRole.findMany({
      include: { permissions: true }
    });

    console.log('\n=== All Roles in Database ===\n');
    roles.forEach((role, index) => {
      console.log(`${index + 1}. Name: ${role.name}`);
      console.log(`   ID: ${role.id}`);
      console.log(`   Description: ${role.description}`);
      console.log(`   isSystem: ${role.isSystem}`);
      console.log(`   Permissions: ${role.permissions.length}`);
      console.log('');
    });

    console.log(`Total roles: ${roles.length}\n`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listRoles();
