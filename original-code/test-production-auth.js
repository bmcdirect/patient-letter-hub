/**
 * Production Authentication Test Script
 * Tests both login and registration endpoints with proper session handling
 */

import https from 'https';
import querystring from 'querystring';

async function makeRequest(hostname, path, method = 'GET', data = null, cookies = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Origin': `https://${hostname}`,
        'Referer': `https://${hostname}/`
      }
    };

    if (cookies) {
      options.headers['Cookie'] = cookies;
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        const setCookieHeader = res.headers['set-cookie'];
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body,
          cookies: setCookieHeader ? setCookieHeader.join('; ') : null
        });
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testProductionAuth() {
  const hostname = 'patient-letter-manager-bmcdirect1.replit.app';
  
  console.log('🔧 Testing Production Authentication System');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Debug endpoint
    console.log('1. Testing debug endpoint...');
    const debugResponse = await makeRequest(hostname, '/api/auth/debug');
    console.log(`   Status: ${debugResponse.statusCode}`);
    console.log(`   Response: ${debugResponse.body}`);
    
    // Test 2: Registration
    console.log('\n2. Testing registration...');
    const timestamp = Date.now();
    const registrationData = {
      firstName: 'Dr. Production',
      lastName: 'Test',
      email: `production.test.${timestamp}@example.com`,
      password: 'practice123',
      practiceName: `Production Test Clinic ${timestamp}`,
      practiceEmail: `admin${timestamp}@productiontestclinic.com`,
      practicePhone: '555-TEST-001',
      practiceAddress: '123 Production St',
      practiceCity: 'Test City',
      practiceState: 'CA',
      practiceZip: '90210'
    };
    
    const registerResponse = await makeRequest(hostname, '/api/auth/register', 'POST', registrationData);
    console.log(`   Status: ${registerResponse.statusCode}`);
    console.log(`   Response: ${registerResponse.body}`);
    console.log(`   Cookies: ${registerResponse.cookies || 'None'}`);
    
    if (registerResponse.statusCode === 201) {
      console.log('   ✅ Registration successful!');
      
      // Test 3: Check session after registration
      console.log('\n3. Testing session after registration...');
      const sessionResponse = await makeRequest(hostname, '/api/auth/user', 'GET', null, registerResponse.cookies);
      console.log(`   Status: ${sessionResponse.statusCode}`);
      console.log(`   Response: ${sessionResponse.body}`);
      
      if (sessionResponse.statusCode === 200) {
        console.log('   ✅ Session working after registration!');
      } else {
        console.log('   ❌ Session not working after registration');
      }
      
      // Test 4: Logout
      console.log('\n4. Testing logout...');
      const logoutResponse = await makeRequest(hostname, '/api/auth/logout', 'POST', null, registerResponse.cookies);
      console.log(`   Status: ${logoutResponse.statusCode}`);
      console.log(`   Response: ${logoutResponse.body}`);
      
      // Test 5: Login
      console.log('\n5. Testing login...');
      const loginData = {
        email: `production.test.${timestamp}@example.com`,
        password: 'practice123'
      };
      
      const loginResponse = await makeRequest(hostname, '/api/auth/login', 'POST', loginData);
      console.log(`   Status: ${loginResponse.statusCode}`);
      console.log(`   Response: ${loginResponse.body}`);
      console.log(`   Cookies: ${loginResponse.cookies || 'None'}`);
      
      if (loginResponse.statusCode === 200) {
        console.log('   ✅ Login successful!');
        
        // Test 6: Access protected endpoint
        console.log('\n6. Testing protected endpoint access...');
        const protectedResponse = await makeRequest(hostname, '/api/dashboard/stats', 'GET', null, loginResponse.cookies);
        console.log(`   Status: ${protectedResponse.statusCode}`);
        console.log(`   Response: ${protectedResponse.body}`);
        
        if (protectedResponse.statusCode === 200) {
          console.log('   ✅ Protected endpoint access successful!');
        } else {
          console.log('   ❌ Protected endpoint access failed');
        }
      } else {
        console.log('   ❌ Login failed');
      }
    } else {
      console.log('   ❌ Registration failed');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('Production authentication test completed');
}

// Run the test
testProductionAuth();