import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteCustomRoles() {
  try {
    console.log('\n=== Deleting All Custom Roles ===\n');
    
    // Get all custom roles (non-system)
    const customRoles = await prisma.accessRole.findMany({
      where: { isSystem: false },
      include: { users: true }
    });

    console.log(`Found ${customRoles.length} custom roles to delete\n`);

    for (const role of customRoles) {
      console.log(`Role: ${role.name}`);
      console.log(`  Users linked: ${role.users.length}`);
      
      if (role.users.length > 0) {
        console.log(`  Unlinking ${role.users.length} users...`);
        
        // Unlink users from this role (set accessRoleId to null)
        await prisma.user.updateMany({
          where: { accessRoleId: role.id },
          data: { accessRoleId: null }
        });
        
        console.log(`  ✅ Users unlinked`);
      }
      
      // Delete the role (permissions will cascade delete)
      await prisma.accessRole.delete({
        where: { id: role.id }
      });
      
      console.log(`  ✅ Role deleted\n`);
    }

    // Show remaining roles
    const remainingRoles = await prisma.accessRole.findMany();
    console.log(`\n=== Summary ===`);
    console.log(`Custom roles deleted: ${customRoles.length}`);
    console.log(`Remaining system roles: ${remainingRoles.filter(r => r.isSystem).length}`);
    console.log(`Total roles: ${remainingRoles.length}\n`);

    // Show system roles
    console.log(`System Roles:`);
    remainingRoles.filter(r => r.isSystem).forEach(r => {
      console.log(`  - ${r.name}`);
    });
    console.log('');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteCustomRoles();
