import axios from 'axios';

async function testCreditHistory() {
  try {
    // Login as distributor
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'dist@dist.com',
      password: 'admin'
    });
    
    const token = loginRes.data.data.token;
    console.log('✓ Logged in as distributor, token:', token.substring(0, 20) + '...');
    
    // Get users list
    const usersRes = await axios.get('http://localhost:5000/api/users?limit=100', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const users = usersRes.data.data;
    console.log('✓ Found', users.length, 'users');
    
    if (users.length === 0) {
      console.log('No users found');
      return;
    }
    
    // Test credit history for first user
    const testUser = users[0];
    console.log('\nTesting credit history for user:', testUser.name, '(ID:', testUser.id + ')');
    
    const historyRes = await axios.get(`http://localhost:5000/api/users/${testUser.id}/credit-history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✓ Credit history endpoint returned:', historyRes.status);
    console.log('Data:', JSON.stringify(historyRes.data, null, 2));
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testCreditHistory();
