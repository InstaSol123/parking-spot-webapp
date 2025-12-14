import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupTestRoles() {
  try {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║              CLEANING UP TEST ROLES & USERS                  ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // Step 1: Find all custom roles
    console.log('📌 STEP 1: Finding all custom test roles...\n');
    
    const customRoles = await prisma.accessRole.findMany({
      where: { isSystem: false },
      include: { users: true, permissions: true }
    });

    console.log(`Found ${customRoles.length} custom role(s) to delete:\n`);

    // Step 2: Delete test roles and associated data
    for (const role of customRoles) {
      console.log(`Deleting role: "${role.name}" (ID: ${role.id})`);
      console.log(`  Users linked: ${role.users.length}`);
      console.log(`  Permissions: ${role.permissions.length}`);

      // Unlink users from this role
      if (role.users.length > 0) {
        console.log(`  → Unlinking ${role.users.length} user(s)...`);
        await prisma.user.updateMany({
          where: { accessRoleId: role.id },
          data: { accessRoleId: null }
        });
      }

      // Delete permissions (cascade)
      console.log(`  → Deleting ${role.permissions.length} permission(s)...`);
      await prisma.permission.deleteMany({
        where: { roleId: role.id }
      });

      // Delete the role
      console.log(`  → Deleting role...`);
      await prisma.accessRole.delete({
        where: { id: role.id }
      });

      console.log(`  ✅ Deleted\n`);
    }

    // Step 3: Find and delete test users
    console.log('📌 STEP 2: Finding test user accounts...\n');
    
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'testmanager'
        }
      }
    });

    console.log(`Found ${testUsers.length} test user account(s) to delete:\n`);

    for (const user of testUsers) {
      console.log(`Deleting user: "${user.name}" (${user.email})`);
      
      // Delete related data
      console.log(`  → Deleting credits...`);
      await prisma.credits.deleteMany({
        where: { userId: user.id }
      });

      console.log(`  → Deleting credit logs...`);
      await prisma.creditLog.deleteMany({
        where: { userId: user.id }
      });

      console.log(`  → Deleting user...`);
      await prisma.user.delete({
        where: { id: user.id }
      });

      console.log(`  ✅ Deleted\n`);
    }

    // Step 4: Show final state
    console.log('📌 STEP 3: Verifying cleanup...\n');

    const remainingRoles = await prisma.accessRole.findMany();
    const systemRoles = remainingRoles.filter(r => r.isSystem);
    const customRolesRemaining = remainingRoles.filter(r => !r.isSystem);
    const remainingTestUsers = await prisma.user.findMany({
      where: { email: { contains: 'testmanager' } }
    });

    console.log(`System Roles (Protected): ${systemRoles.length}`);
    systemRoles.forEach(r => {
      console.log(`  - ${r.name}`);
    });

    console.log(`\nCustom Roles (Remaining): ${customRolesRemaining.length}`);
    if (customRolesRemaining.length === 0) {
      console.log('  ✅ All custom roles deleted');
    } else {
      customRolesRemaining.forEach(r => {
        console.log(`  - ${r.name}`);
      });
    }

    console.log(`\nTest User Accounts (Remaining): ${remainingTestUsers.length}`);
    if (remainingTestUsers.length === 0) {
      console.log('  ✅ All test users deleted');
    } else {
      remainingTestUsers.forEach(u => {
        console.log(`  - ${u.email}`);
      });
    }

    // Final summary
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    CLEANUP COMPLETE                          ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log(`✅ Deleted Custom Roles: ${customRoles.length}`);
    console.log(`✅ Deleted Test Users: ${testUsers.length}`);
    console.log(`✅ System Roles Preserved: ${systemRoles.length}`);
    console.log('\n🎉 System is ready for fresh role testing!\n');

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestRoles();
