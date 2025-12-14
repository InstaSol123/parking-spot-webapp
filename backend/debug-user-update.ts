import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function testUserUpdate() {
  console.log('\n=== Testing User Update Error ===\n');

  try {
    // Step 1: Login as admin
    console.log('📌 Logging in as admin...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@admin.com',
      password: 'admin'
    });

    const adminToken = loginRes.data.data.token;
    console.log('✅ Logged in\n');

    // Step 2: Get a user to update
    console.log('📌 Fetching users...');
    const usersRes = await axios.get(`${API_BASE}/users?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (!usersRes.data.data || usersRes.data.data.length === 0) {
      console.log('❌ No users found');
      return;
    }

    const testUser = usersRes.data.data[0];
    console.log(`✅ Found user: ${testUser.name} (${testUser.email})\n`);

    // Step 3: Try to update the user with plans
    console.log('📌 Attempting to update user with plans...');
    console.log(`User ID: ${testUser.id}`);
    console.log(`Payload: { plans: [{...}] }\n`);

    try {
      const updateRes = await axios.put(
        `${API_BASE}/users/${testUser.id}`,
        {
          plans: [
            { id: 'plan1', name: 'Test Plan', credits: 100, price: 50 }
          ]
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
          validateStatus: () => true
        }
      );

      console.log(`Status: ${updateRes.status}`);
      console.log(`Response:`, updateRes.data);

      if (updateRes.status === 500) {
        console.log('\n⚠️ 500 Error Details:');
        console.log(JSON.stringify(updateRes.data, null, 2));
      }
    } catch (error: any) {
      console.log('❌ Request failed:', error.message);
      console.log('Error:', error.response?.data || error);
    }

  } catch (error: any) {
    console.error('Fatal error:', error.message);
  }
}

testUserUpdate();
