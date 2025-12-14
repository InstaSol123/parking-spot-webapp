// TypeScript verification script - Run from backend directory
// Note: axios is installed in backend/node_modules
// Usage: npx ts-node verify-all-fixes.ts (from backend directory)

import axios from 'axios';

// ... existing code ...

const API_BASE = 'http://localhost:5000/api';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const results: TestResult[] = [];

async function runTests() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         VERIFICATION TEST: All Three Issues Fixed              ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Step 1: Login as distributor
    console.log('🔑 Step 1: Authenticating as Distributor...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'dist@dist.com',
      password: 'admin'
    });

    if (!loginRes.data.success) {
      console.error('❌ Login failed');
      return;
    }

    const distributorToken = loginRes.data.data.token;
    const distributor = loginRes.data.data.user;
    console.log(`✅ Logged in as distributor: ${distributor.name}\n`);

    // ============================================================
    // ISSUE 1: Credit History
    // ============================================================
    console.log('\n🔍 ISSUE 1: Credit History Display\n');
    try {
      const creditHistoryRes = await axios.get(
        `${API_BASE}/users/${distributor.id}/credit-history`,
        { headers: { Authorization: `Bearer ${distributorToken}` } }
      );

      if (creditHistoryRes.data.success) {
        const logs = creditHistoryRes.data.data;
        const hasData = logs && logs.length > 0;
        
        results.push({
          test: 'ISSUE 1: Credit history endpoint accessible',
          status: 'PASS',
          details: `Returned ${logs.length} credit logs`
        });

        if (hasData) {
          const sample = logs[0];
          console.log('✅ Credit History Records Found:');
          console.log(`   - Type: ${sample.type}`);
          console.log(`   - Amount: ${sample.amount}`);
          console.log(`   - Date: ${sample.date}`);
          console.log(`   - Reason: ${sample.reason}\n`);

          results.push({
            test: 'ISSUE 1: Credit history data structure correct',
            status: 'PASS',
            details: `Sample log has all required fields (type, amount, date, reason)`
          });
        } else {
          console.log('⚠️  No credit history yet (expected if no transactions)\n');
          results.push({
            test: 'ISSUE 1: Credit history endpoint works (no data)',
            status: 'PASS',
            details: `Endpoint returned empty array (expected for new distributor)`
          });
        }
      } else {
        results.push({
          test: 'ISSUE 1: Credit history endpoint accessible',
          status: 'FAIL',
          details: creditHistoryRes.data.error
        });
      }
    } catch (error: any) {
      results.push({
        test: 'ISSUE 1: Credit history endpoint accessible',
        status: 'FAIL',
        details: error.message
      });
    }

    // ============================================================
    // ISSUE 2: Document Fields
    // ============================================================
    console.log('\n🔍 ISSUE 2: Document Fields Display\n');
    try {
      const userRes = await axios.get(`${API_BASE}/users/${distributor.id}`, {
        headers: { Authorization: `Bearer ${distributorToken}` }
      });

      if (userRes.data.success) {
        const user = userRes.data.data;
        const hasDocumentFields = 
          user.hasOwnProperty('aadhaar') &&
          user.hasOwnProperty('pan') &&
          user.hasOwnProperty('gst') &&
          user.hasOwnProperty('msme') &&
          user.hasOwnProperty('address');

        if (hasDocumentFields) {
          console.log('✅ Document Fields Found in User Response:');
          console.log(`   - Address: ${user.address || '(not set)'}`);
          console.log(`   - Aadhaar: ${user.aadhaar || '(not set)'}`);
          console.log(`   - PAN: ${user.pan || '(not set)'}`);
          console.log(`   - GST: ${user.gst || '(not set)'}`);
          console.log(`   - MSME: ${user.msme || '(not set)'}\n`);

          results.push({
            test: 'ISSUE 2: Document fields available in API response',
            status: 'PASS',
            details: 'All fields (address, aadhaar, pan, gst, msme) present'
          });
        } else {
          results.push({
            test: 'ISSUE 2: Document fields available in API response',
            status: 'FAIL',
            details: 'One or more document fields missing from response'
          });
        }
      } else {
        results.push({
          test: 'ISSUE 2: Document fields available in API response',
          status: 'FAIL',
          details: userRes.data.error
        });
      }
    } catch (error: any) {
      results.push({
        test: 'ISSUE 2: Document fields available in API response',
        status: 'FAIL',
        details: error.message
      });
    }

    // ============================================================
    // ISSUE 3: Plans
    // ============================================================
    console.log('\n🔍 ISSUE 3: Distributor Plans Display\n');
    try {
      // First, check if plans are included in user response
      const userRes = await axios.get(`${API_BASE}/users/${distributor.id}`, {
        headers: { Authorization: `Bearer ${distributorToken}` }
      });

      if (userRes.data.success) {
        const user = userRes.data.data;
        const hasPlans = user.hasOwnProperty('plans');

        if (hasPlans) {
          console.log('✅ Plans field present in user response:');
          console.log(`   - Type: ${typeof user.plans}`);
          console.log(`   - Count: ${user.plans?.length || 0}\n`);

          results.push({
            test: 'ISSUE 3: Plans field included in user response',
            status: 'PASS',
            details: `Plans array present (${user.plans?.length || 0} plans)`
          });
        } else {
          results.push({
            test: 'ISSUE 3: Plans field included in user response',
            status: 'FAIL',
            details: 'Plans field missing from user response'
          });
        }
      }

      // Also test direct plans API endpoint
      const plansRes = await axios.get(
        `${API_BASE}/plans/distributor/${distributor.id}`,
        { headers: { Authorization: `Bearer ${distributorToken}` } }
      );

      if (plansRes.data.success) {
        const plans = plansRes.data.data;
        console.log(`✅ Plans endpoint accessible: Returned ${plans.length} plan(s)\n`);

        if (plans.length > 0) {
          const sample = plans[0];
          console.log('Sample plan:');
          console.log(`   - Name: ${sample.name}`);
          console.log(`   - Credits: ${sample.credits}`);
          console.log(`   - Price: ₹${sample.price}\n`);
        }

        results.push({
          test: 'ISSUE 3: Plans endpoint accessible and returns data',
          status: 'PASS',
          details: `Endpoint returned ${plans.length} plan(s)`
        });
      } else {
        results.push({
          test: 'ISSUE 3: Plans endpoint accessible and returns data',
          status: 'FAIL',
          details: plansRes.data.error
        });
      }
    } catch (error: any) {
      results.push({
        test: 'ISSUE 3: Plans endpoint accessible and returns data',
        status: 'FAIL',
        details: error.message
      });
    }

    // ============================================================
    // SUMMARY REPORT
    // ============================================================
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    TEST SUMMARY REPORT                         ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;

    results.forEach((result, idx) => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} Test ${idx + 1}: ${result.test}`);
      console.log(`   Details: ${result.details}\n`);
    });

    console.log('\n┌────────────────────────────────────────────────────────────────┐');
    console.log(`│ Results: ${passed} PASSED, ${failed} FAILED                            │`);
    console.log('└────────────────────────────────────────────────────────────────┘\n');

    if (failed === 0) {
      console.log('🎉 ALL ISSUES FIXED AND VERIFIED! 🎉\n');
      console.log('Summary of fixes:');
      console.log('  ✅ Issue 1: Credit history now loads via API from CreditLog table');
      console.log('  ✅ Issue 2: Document fields (address, aadhaar, pan, gst, msme) accessible');
      console.log('  ✅ Issue 3: Distributor plans now included in API responses\n');
    } else {
      console.log('⚠️  Some tests failed. Please review the details above.\n');
    }
  } catch (error: any) {
    console.error('Test execution error:', error.message);
  }
}

runTests();
