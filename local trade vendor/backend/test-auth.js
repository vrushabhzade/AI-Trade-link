// Simple test script to verify authentication endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/auth';

async function testAuth() {
  console.log('🧪 Testing TradeLink Authentication System...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ Health check passed:', healthResponse.data.status);

    // Test 2: Register a new user
    console.log('\n2. Testing user registration...');
    const registerData = {
      email: 'test@example.com',
      password: 'TestPassword123',
      fullName: 'Test User',
      role: 'buyer',
      preferredLanguage: 'en'
    };

    const registerResponse = await axios.post(`${BASE_URL}/register`, registerData);
    console.log('✅ Registration successful');
    console.log('User ID:', registerResponse.data.data.user.id);
    console.log('Token received:', registerResponse.data.data.token ? 'Yes' : 'No');

    // Test 3: Login with the same user
    console.log('\n3. Testing user login...');
    const loginData = {
      email: 'test@example.com',
      password: 'TestPassword123'
    };

    const loginResponse = await axios.post(`${BASE_URL}/login`, loginData);
    console.log('✅ Login successful');
    console.log('User role:', loginResponse.data.data.user.role);
    
    const token = loginResponse.data.data.token;

    // Test 4: Get user profile
    console.log('\n4. Testing get profile...');
    const profileResponse = await axios.get(`${BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile fetch successful');
    console.log('User name:', profileResponse.data.data.fullName);

    // Test 5: Update profile
    console.log('\n5. Testing profile update...');
    const updateData = {
      fullName: 'Updated Test User',
      preferredLanguage: 'es',
      location: {
        city: 'Madrid',
        country: 'Spain',
        coordinates: [-3.7038, 40.4168]
      }
    };

    const updateResponse = await axios.put(`${BASE_URL}/profile`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile update successful');
    console.log('Updated name:', updateResponse.data.data.fullName);
    console.log('Updated language:', updateResponse.data.data.preferredLanguage);

    console.log('\n🎉 All authentication tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testAuth();