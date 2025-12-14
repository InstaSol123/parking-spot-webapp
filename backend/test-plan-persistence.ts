import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function testPlanPersistence() {
  console.log('\n=== Testing Plan Persistence Fix ===\n');

  try {
    // Step 1: Login as distributor
    console.log('📌 Step 1: Logging in as distributor...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'dist@dist.com',
      password: 'admin'
    });

    const token = loginRes.data.data.token;
    const distributorId = loginRes.data.data.user.id;
    console.log(`✅ Logged in as distributor: ${distributorId}\n`);

    // Step 2: Create a plan
    console.log('📌 Step 2: Creating a test plan...');
    const createRes = await axios.post(
      `${API_BASE}/plans`,
      {
        name: 'Premium Pack',
        credits: 1000,
        price: 500
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true
      }
    );

    if (!createRes.data.success) {
      console.error('❌ Plan creation failed:', createRes.data);
      return;
    }

    const planId = createRes.data.data.id;
    console.log(`✅ Plan created successfully`);
    console.log(`   Plan ID: ${planId}`);
    console.log(`   Name: ${createRes.data.data.name}`);
    console.log(`   Credits: ${createRes.data.data.credits}`);
    console.log(`   Price: ${createRes.data.data.price}\n`);

    // Step 3: Fetch plans immediately (should show the new plan)
    console.log('📌 Step 3: Fetching plans immediately after creation...');
    const fetchRes1 = await axios.get(
      `${API_BASE}/plans/distributor/${distributorId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true
      }
    );

    if (!fetchRes1.data.success) {
      console.error('❌ Fetch plans failed:', fetchRes1.data);
      return;
    }

    const plans = fetchRes1.data.data;
    console.log(`✅ Fetched ${plans.length} plan(s) from database`);
    plans.forEach((p: any) => {
      console.log(`   - ${p.name} (${p.credits} credits @ ₹${p.price})`);
    });

    // Verify plan exists
    const planExists = plans.some((p: any) => p.id === planId);
    if (!planExists) {
      console.error('❌ FAIL: Plan not found in database immediately after creation!');
      return;
    }
    console.log(`✅ Plan found in database immediately after creation\n`);

    // Step 4: Simulate page refresh (wait and fetch again)
    console.log('📌 Step 4: Simulating page refresh (waiting 2 seconds)...');
    await new Promise(r => setTimeout(r, 2000));

    const fetchRes2 = await axios.get(
      `${API_BASE}/plans/distributor/${distributorId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true
      }
    );

    if (!fetchRes2.data.success) {
      console.error('❌ Fetch after refresh failed:', fetchRes2.data);
      return;
    }

    const plansAfterRefresh = fetchRes2.data.data;
    console.log(`✅ Fetched ${plansAfterRefresh.length} plan(s) after refresh`);
    plansAfterRefresh.forEach((p: any) => {
      console.log(`   - ${p.name} (${p.credits} credits @ ₹${p.price})`);
    });

    // Verify plan still exists
    const planPersists = plansAfterRefresh.some((p: any) => p.id === planId);
    if (!planPersists) {
      console.error('❌ FAIL: Plan disappeared after page refresh!');
      return;
    }
    console.log(`✅ Plan persisted after page refresh (FIXED!)\n`);

    // Step 5: Update the plan
    console.log('📌 Step 5: Updating the plan...');
    const updateRes = await axios.put(
      `${API_BASE}/plans/${planId}`,
      {
        name: 'Premium Pack Plus',
        credits: 2000,
        price: 999
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true
      }
    );

    if (!updateRes.data.success) {
      console.error('❌ Plan update failed:', updateRes.data);
      return;
    }

    console.log(`✅ Plan updated successfully`);
    console.log(`   New Name: ${updateRes.data.data.name}`);
    console.log(`   New Credits: ${updateRes.data.data.credits}`);
    console.log(`   New Price: ${updateRes.data.data.price}\n`);

    // Step 6: Verify update persisted
    console.log('📌 Step 6: Verifying update persisted...');
    const fetchRes3 = await axios.get(
      `${API_BASE}/plans/distributor/${distributorId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true
      }
    );

    const updatedPlan = fetchRes3.data.data.find((p: any) => p.id === planId);
    if (!updatedPlan) {
      console.error('❌ Plan not found after update!');
      return;
    }

    if (updatedPlan.name !== 'Premium Pack Plus') {
      console.error('❌ Plan name did not persist:', updatedPlan.name);
      return;
    }

    console.log(`✅ Plan updates persisted successfully`);
    console.log(`   Name: ${updatedPlan.name}`);
    console.log(`   Credits: ${updatedPlan.credits}`);
    console.log(`   Price: ${updatedPlan.price}\n`);

    // Step 7: Delete the plan
    console.log('📌 Step 7: Deleting the plan...');
    const deleteRes = await axios.delete(
      `${API_BASE}/plans/${planId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true
      }
    );

    if (!deleteRes.data.success) {
      console.error('❌ Plan deletion failed:', deleteRes.data);
      return;
    }

    console.log(`✅ Plan deleted successfully\n`);

    // Step 8: Verify deletion persisted
    console.log('📌 Step 8: Verifying deletion persisted...');
    const fetchRes4 = await axios.get(
      `${API_BASE}/plans/distributor/${distributorId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true
      }
    );

    const deletedPlan = fetchRes4.data.data.find((p: any) => p.id === planId);
    if (deletedPlan) {
      console.error('❌ Plan still exists after deletion!');
      return;
    }

    console.log(`✅ Plan deletion persisted successfully\n`);

    // Final Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL TESTS PASSED - PLAN PERSISTENCE FIXED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Plans are now created directly in the database');
    console.log('✅ Plans persist after page refresh');
    console.log('✅ Plan updates are saved to database');
    console.log('✅ Plan deletions are persisted\n');

  } catch (error: any) {
    console.error('Fatal error:', error.message);
  }
}

testPlanPersistence();
