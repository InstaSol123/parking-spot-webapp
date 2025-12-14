import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignDefaultRole() {
  try {
    console.log('\n=== Assigning Default Limited Role to Orphaned Users ===\n');
    
    // Create a "Limited Staff" role with minimal permissions
    let limitedRole = await prisma.accessRole.findFirst({
      where: { name: 'Limited Staff (No Permissions)' }
    });

    if (!limitedRole) {
      console.log('Creating "Limited Staff (No Permissions)" role...');
      limitedRole = await prisma.accessRole.create({
        data: {
          name: 'Limited Staff (No Permissions)',
          description: 'Default role for staff with no specific permissions',
          isSystem: false,
          permissions: {
            create: [] // No permissions
          }
        }
      });
      console.log('✅ Role created\n');
    } else {
      console.log('✅ "Limited Staff (No Permissions)" role already exists\n');
    }

    // Get all orphaned users
    const orphanedUsers = await prisma.user.findMany({
      where: {
        role: 'SUPER_ADMIN',
        accessRoleId: null
      }
    });

    console.log(`Found ${orphanedUsers.length} orphaned users\n`);

    for (const user of orphanedUsers) {
      console.log(`Assigning default role to: ${user.name} (${user.email})`);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { accessRoleId: limitedRole.id }
      });
      
      console.log(`  ✅ Assigned!\n`);
    }

    console.log(`\n=== Complete ===`);
    console.log(`All orphaned users now have the "Limited Staff (No Permissions)" role`);
    console.log(`They will be DENIED access to all resources until proper permissions are assigned\n`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignDefaultRole();
