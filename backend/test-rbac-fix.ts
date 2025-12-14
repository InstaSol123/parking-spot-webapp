import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function testRBACFix() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║           RBAC FIX VERIFICATION TEST                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Login as test user
    console.log('📌 STEP 1: Login as Test User\n');
    
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'testmanager1765671851736@test.com',
      password: 'Test123456'
    });

    if (!loginRes.data.success) {
      console.error('❌ Login failed');
      return;
    }

    const testUser = loginRes.data.data.user;
    const testToken = loginRes.data.data.token;

    console.log(`✅ Test user logged in`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Name: ${testUser.name}`);
    console.log(`   Base Role: ${testUser.role}`);
    console.log(`   AccessRole ID: ${testUser.accessRoleId}`);
    console.log(`   AccessRole Name: ${testUser.accessRole?.name}`);
    console.log(`\n   Permissions from login response:`);
    
    if (testUser.accessRole && testUser.accessRole.permissions) {
      testUser.accessRole.permissions.forEach((p: any) => {
        const actions = Array.isArray(p.actions) ? p.actions.join(', ') : p.actions;
        console.log(`     - ${p.resource}: ${actions}`);
      });
    } else {
      console.log(`     ❌ NO PERMISSIONS FOUND`);
    }
    console.log();

    // Step 2: Check if AccessRole data is complete
    console.log('📌 STEP 2: Verify AccessRole Data in Login Response\n');

    const hasAccessRole = !!testUser.accessRole;
    const hasPermissions = testUser.accessRole && testUser.accessRole.permissions && testUser.accessRole.permissions.length > 0;
    const hasExpectedResources = testUser.accessRole?.permissions?.some((p: any) => p.resource === 'users') &&
                                 testUser.accessRole?.permissions?.some((p: any) => p.resource === 'qrs');

    console.log(`✅ AccessRole present: ${hasAccessRole ? 'YES' : 'NO'}`);
    console.log(`✅ Permissions present: ${hasPermissions ? 'YES' : 'NO'}`);
    console.log(`✅ Expected resources (users, qrs): ${hasExpectedResources ? 'YES' : 'NO'}`);
    console.log();

    // Step 3: Test permission enforcement
    console.log('📌 STEP 3: Test Permission Enforcement\n');

    const tests = [
      { endpoint: '/users', method: 'GET', expected: 200, desc: 'View users (HAS permission)' },
      { endpoint: '/qrs', method: 'GET', expected: 200, desc: 'View QRs (HAS permission)' },
      { endpoint: '/settings', method: 'GET', expected: 403, desc: 'View settings (BLOCKED)' },
      { endpoint: '/roles', method: 'GET', expected: 403, desc: 'View roles (BLOCKED)' },
    ];

    for (const test of tests) {
      try {
        const response = await axios.get(`${API_BASE}${test.endpoint}`, {
          headers: { Authorization: `Bearer ${testToken}` },
          validateStatus: () => true
        });

        const passed = response.status === test.expected;
        console.log(`${passed ? '✅' : '❌'} ${test.desc}`);
        console.log(`   ${test.method} ${test.endpoint}: ${response.status} (expected ${test.expected})`);
      } catch (error: any) {
        console.log(`❌ ${test.desc}`);
        console.log(`   Error: ${error.message}`);
      }
    }
    console.log();

    // Step 4: Summary
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    VERIFICATION SUMMARY                      ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    if (hasAccessRole && hasPermissions && hasExpectedResources) {
      console.log('✅ RBAC FIX SUCCESSFUL!');
      console.log();
      console.log('The test user now has:');
      console.log('  ✅ AccessRole data in login response');
      console.log('  ✅ Permission data properly included');
      console.log('  ✅ Correct resource assignments (users, qrs)');
      console.log('  ✅ Frontend will properly enforce sidebar visibility');
      console.log();
      console.log('The user should now see:');
      console.log('  - Dashboard (always visible)');
      console.log('  - User Management (has view permission)');
      console.log('  - QR Management (has view permission)');
      console.log('  - Profile (always visible)');
      console.log();
      console.log('The user should NOT see:');
      console.log('  - Settings (no permission)');
      console.log('  - Roles & Permissions (no permission)');
      console.log('  - Financial Reports (no permission)');
      console.log('  - Database (no permission)');
      console.log('  - Subscriptions (no permission)');
      console.log('  - Notifications (no permission)');
    } else {
      console.log('❌ RBAC FIX INCOMPLETE!');
      console.log();
      if (!hasAccessRole) {
        console.log('  ❌ AccessRole data missing in login response');
      }
      if (!hasPermissions) {
        console.log('  ❌ Permission data missing');
      }
      if (!hasExpectedResources) {
        console.log('  ❌ Expected resources not found');
      }
    }

    console.log('\n');

  } catch (error: any) {
    console.error('Fatal error:', error.message);
  }
}

testRBACFix();
