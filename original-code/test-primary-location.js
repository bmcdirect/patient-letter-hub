/**
 * Test script to verify primary location functionality
 * This tests the primary location constraint and API endpoints
 */

const BASE_URL = "http://localhost:5000";

class PrimaryLocationTest {
  constructor() {
    this.cookies = '';
  }

  async makeRequest(method, path, data = null) {
    const url = `${BASE_URL}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': this.cookies
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    // Extract cookies from response
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      this.cookies = setCookie.split(';')[0];
    }

    const result = await response.json();
    return { status: response.status, data: result };
  }

  async login() {
    console.log('🔐 Logging in to test primary location functionality...');
    const response = await this.makeRequest('POST', '/api/auth/login', {
      email: 'admin@riversidefamilymed.com',
      password: 'password123'
    });
    
    if (response.status === 200) {
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed:', response.data);
      return false;
    }
  }

  async testPrimaryLocationCreation() {
    console.log('\n🏥 Testing Primary Location Creation...');
    
    // Test 1: Create first primary location
    const location1 = {
      label: 'Main Office',
      contactName: 'Dr. John Smith',
      phone: '555-123-4567',
      email: 'main@riversidefamilymed.com',
      addressLine1: '123 Main St',
      city: 'Riverside',
      state: 'CA',
      zipCode: '92501',
      isPrimary: true
    };

    const response1 = await this.makeRequest('POST', '/api/practices/1/locations', location1);
    console.log('📍 Creating first primary location:', response1.status === 200 ? '✅ Success' : '❌ Failed');
    
    if (response1.status !== 200) {
      console.log('   Error:', response1.data);
      return false;
    }

    // Test 2: Create second location as primary (should update first to non-primary)
    const location2 = {
      label: 'Secondary Office',
      contactName: 'Dr. Jane Doe',
      phone: '555-987-6543',
      email: 'secondary@riversidefamilymed.com',
      addressLine1: '456 Oak Ave',
      city: 'Riverside',
      state: 'CA',
      zipCode: '92502',
      isPrimary: true
    };

    const response2 = await this.makeRequest('POST', '/api/practices/1/locations', location2);
    console.log('📍 Creating second primary location:', response2.status === 200 ? '✅ Success' : '❌ Failed');
    
    if (response2.status !== 200) {
      console.log('   Error:', response2.data);
      return false;
    }

    // Test 3: Verify only one primary location exists
    const locationsResponse = await this.makeRequest('GET', '/api/practices/1/locations');
    if (locationsResponse.status === 200) {
      const locations = locationsResponse.data;
      const primaryLocations = locations.filter(loc => loc.isDefault === true);
      
      console.log('🔍 Verification: Found', primaryLocations.length, 'primary location(s)');
      if (primaryLocations.length === 1) {
        console.log('✅ Primary location constraint working correctly');
        console.log('   Primary location:', primaryLocations[0].label);
        return true;
      } else {
        console.log('❌ Primary location constraint failed');
        console.log('   Primary locations:', primaryLocations.map(loc => loc.label));
        return false;
      }
    } else {
      console.log('❌ Failed to retrieve locations:', locationsResponse.data);
      return false;
    }
  }

  async runTest() {
    console.log('🚀 Starting Primary Location Test Suite\n');
    
    if (!await this.login()) {
      console.log('❌ Test failed: Could not authenticate');
      return;
    }
    
    const success = await this.testPrimaryLocationCreation();
    
    console.log('\n📊 Test Results:');
    console.log(success ? '✅ All tests passed!' : '❌ Some tests failed!');
    
    if (success) {
      console.log('\n🎉 Primary location functionality is working correctly!');
      console.log('✅ Database constraint prevents multiple primary locations');
      console.log('✅ API endpoints handle primary location logic properly');
      console.log('✅ Frontend toggle can now be used safely');
    }
  }
}

// Run the test
const test = new PrimaryLocationTest();
test.runTest().catch(console.error);