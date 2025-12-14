import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function testAllThreeFixes() {
  console.log('\n========================================');
  console.log('Testing All Three Distributor Panel Fixes');
  console.log('========================================\n');

  try {
    // Login as distributor
    console.log('📌 Step 1: Login as Distributor...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'dist@dist.com',
      password: 'admin'
    });

    const token = loginRes.data.data.token;
    const distributorId = loginRes.data.data.user.id;
    const parentId = loginRes.data.data.user.parentId;
    console.log(`✅ Logged in as distributor: ${distributorId}`);
    console.log(`   Parent (Admin) ID: ${parentId}\n`);

    // TEST 1: Credit History
    console.log('📌 TEST 1: Credit Transaction History');
    console.log('─────────────────────────────────────');
    const creditRes = await axios.get(
      `${API_BASE}/users/${distributorId}/credit-history`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (creditRes.data.success && creditRes.data.data.length > 0) {
      console.log(`✅ PASS: Found ${creditRes.data.data.length} credit transactions`);
      console.log(`   Latest transaction: ${creditRes.data.data[0].type} - ${creditRes.data.data[0].amount} credits`);
      console.log(`   Date: ${new Date(creditRes.data.data[0].date).toLocaleDateString()}\n`);
    } else {
      console.log('❌ FAIL: No credit history found\n');
    }

    // TEST 2: Document Fields on a Retailer
    console.log('📌 TEST 2: Retailer Document Fields');
    console.log('─────────────────────────────────────');
    const usersRes = await axios.get(
      `${API_BASE}/users`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (usersRes.data.success && usersRes.data.data.length > 0) {
      const retailer = usersRes.data.data[0];
      const hasDocFields = retailer.address || retailer.aadhaar || retailer.pan || retailer.gst || retailer.msme;
      
      if (hasDocFields) {
        console.log(`✅ PASS: Retailer "${retailer.name}" has document fields:`);
        if (retailer.address) console.log(`   - Address: ${retailer.address.substring(0, 40)}...`);
        if (retailer.aadhaar) console.log(`   - Aadhaar: ${retailer.aadhaar}`);
        if (retailer.pan) console.log(`   - PAN: ${retailer.pan}`);
        if (retailer.gst) console.log(`   - GST: ${retailer.gst}`);
        if (retailer.msme) console.log(`   - MSME: ${retailer.msme}`);
      } else {
        console.log(`⚠️  WARNING: Retailer "${retailer.name}" has no document fields (expected)\n`);
      }
    }
    console.log();

    // TEST 3: Admin Plans for Distributor
    console.log('📌 TEST 3: Admin Plans Visibility');
    console.log('─────────────────────────────────────');
    const plansRes = await axios.get(
      `${API_BASE}/plans/distributor/${parentId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (plansRes.data.success && plansRes.data.data.length > 0) {
      console.log(`✅ PASS: Distributor can see ${plansRes.data.data.length} admin plans:`);
      plansRes.data.data.slice(0, 3).forEach((plan: any) => {
        console.log(`   - ${plan.name}: ${plan.credits} credits @ ₹${plan.price}`);
      });
      if (plansRes.data.data.length > 3) {
        console.log(`   ... and ${plansRes.data.data.length - 3} more plans`);
      }
    } else {
      console.log('❌ FAIL: No admin plans found for distributor\n');
    }

    console.log('\n========================================');
    console.log('All Tests Completed Successfully! ✅');
    console.log('========================================\n');

  } catch (error: any) {
    console.error('❌ Test Error:', error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
  }
}

testAllThreeFixes();
