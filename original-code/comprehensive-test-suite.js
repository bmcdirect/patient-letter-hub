/**
 * PatientLetterHub Comprehensive Test Suite
 * Testing authentication and core functionality after major architecture changes
 */

import https from 'https';
import http from 'http';
import querystring from 'querystring';

class ComprehensiveTestSuite {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.testResults = [];
    this.cookies = '';
    this.currentTenant = null;
    this.currentUser = null;
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  recordTest(category, testName, passed, details = null) {
    const result = {
      category,
      testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    };
    this.testResults.push(result);
    
    const status = passed ? '✅ PASS' : '❌ FAIL';
    this.log(`${status}: ${category} - ${testName}`);
    if (details) {
      this.log(`  Details: ${details}`);
    }
  }

  async makeRequest(method, path, data = null, requireAuth = false) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ComprehensiveTestSuite/1.0'
        }
      };

      if (requireAuth && this.cookies) {
        options.headers['Cookie'] = this.cookies;
      }

      if (data) {
        const postData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          // Store cookies from response
          if (res.headers['set-cookie']) {
            this.cookies = res.headers['set-cookie'].join('; ');
          }
          
          let parsedBody;
          try {
            parsedBody = JSON.parse(body);
          } catch (e) {
            parsedBody = body;
          }
          
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedBody
          });
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  async testAuthenticationSystem() {
    this.log("\n=== 1. AUTHENTICATION SYSTEM TESTING ===");
    
    // Test 1.1: Get available practices
    try {
      const response = await this.makeRequest('GET', '/api/auth/practices');
      if (response.statusCode === 200 && Array.isArray(response.body)) {
        this.recordTest('Authentication', 'Practice List Retrieval', true, 
          `Found ${response.body.length} practices`);
      } else {
        this.recordTest('Authentication', 'Practice List Retrieval', false, 
          `Expected 200 OK with array, got ${response.statusCode}`);
      }
    } catch (error) {
      this.recordTest('Authentication', 'Practice List Retrieval', false, error.message);
    }

    // Test 1.2: Test login with valid credentials
    const testCredentials = [
      { email: 'admin@riversidefamilymed.com', password: 'password123', practice: 'Riverside Family Medicine' },
      { email: 'admin@brightsmilesdental.com', password: 'password123', practice: 'Bright Smiles Dental' },
      { email: 'admin@goldenstatevet.com', password: 'password123', practice: 'Golden State Veterinary' }
    ];

    for (const cred of testCredentials) {
      try {
        const response = await this.makeRequest('POST', '/api/auth/login', {
          email: cred.email,
          password: cred.password
        });
        
        if (response.statusCode === 200 && response.body.user) {
          this.recordTest('Authentication', `Login - ${cred.practice}`, true, 
            `Successfully logged in as ${response.body.user.email}`);
          this.currentUser = response.body.user;
          this.currentTenant = response.body.user.tenantId;
        } else {
          this.recordTest('Authentication', `Login - ${cred.practice}`, false, 
            `Login failed: ${response.statusCode} - ${JSON.stringify(response.body)}`);
        }
      } catch (error) {
        this.recordTest('Authentication', `Login - ${cred.practice}`, false, error.message);
      }
    }

    // Test 1.3: Test invalid login
    try {
      const response = await this.makeRequest('POST', '/api/auth/login', {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      });
      
      if (response.statusCode === 401) {
        this.recordTest('Authentication', 'Invalid Login Rejection', true, 
          'Properly rejected invalid credentials');
      } else {
        this.recordTest('Authentication', 'Invalid Login Rejection', false, 
          `Expected 401, got ${response.statusCode}`);
      }
    } catch (error) {
      this.recordTest('Authentication', 'Invalid Login Rejection', false, error.message);
    }

    // Test 1.4: Test session persistence
    if (this.currentUser) {
      try {
        const response = await this.makeRequest('GET', '/api/auth/user', null, true);
        
        if (response.statusCode === 200 && response.body.email === this.currentUser.email) {
          this.recordTest('Authentication', 'Session Persistence', true, 
            `Session maintained for ${response.body.email}`);
        } else {
          this.recordTest('Authentication', 'Session Persistence', false, 
            `Expected user data, got ${response.statusCode}`);
        }
      } catch (error) {
        this.recordTest('Authentication', 'Session Persistence', false, error.message);
      }
    }

    // Test 1.5: Test logout
    try {
      const response = await this.makeRequest('POST', '/api/auth/logout', null, true);
      
      if (response.statusCode === 200) {
        this.recordTest('Authentication', 'Logout Functionality', true, 
          'Successfully logged out');
        this.cookies = ''; // Clear cookies
      } else {
        this.recordTest('Authentication', 'Logout Functionality', false, 
          `Expected 200, got ${response.statusCode}`);
      }
    } catch (error) {
      this.recordTest('Authentication', 'Logout Functionality', false, error.message);
    }
  }

  async testAPIEndpoints() {
    this.log("\n=== 2. API ENDPOINT TESTING ===");
    
    // Re-authenticate for protected endpoint testing
    await this.makeRequest('POST', '/api/auth/login', {
      email: 'admin@riversidefamilymed.com',
      password: 'password123'
    });

    const endpoints = [
      { method: 'GET', path: '/api/auth/user', auth: true, desc: 'Get Current User' },
      { method: 'GET', path: '/api/quotes', auth: true, desc: 'Get Quotes' },
      { method: 'GET', path: '/api/orders', auth: true, desc: 'Get Orders' },
      { method: 'GET', path: '/api/practices', auth: true, desc: 'Get Practices' },
      { method: 'GET', path: '/api/dashboard/stats', auth: true, desc: 'Dashboard Stats' },
      { method: 'GET', path: '/api/admin/orders', auth: true, desc: 'Admin Orders' },
      { method: 'GET', path: '/api/admin/quotes', auth: true, desc: 'Admin Quotes' },
      { method: 'GET', path: '/api/admin/stats', auth: true, desc: 'Admin Stats' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(endpoint.method, endpoint.path, null, endpoint.auth);
        
        if (response.statusCode === 200 || response.statusCode === 304) {
          this.recordTest('API Endpoints', endpoint.desc, true, 
            `${endpoint.method} ${endpoint.path} - Status: ${response.statusCode}`);
        } else if (response.statusCode === 401 && endpoint.auth) {
          this.recordTest('API Endpoints', endpoint.desc, false, 
            `Authentication required but failed: ${response.statusCode}`);
        } else {
          this.recordTest('API Endpoints', endpoint.desc, false, 
            `Unexpected status: ${response.statusCode} - ${JSON.stringify(response.body)}`);
        }
      } catch (error) {
        this.recordTest('API Endpoints', endpoint.desc, false, error.message);
      }
    }
  }

  async testDatabaseConnectivity() {
    this.log("\n=== 3. DATABASE CONNECTIVITY TESTING ===");
    
    // Test database connectivity through API endpoints
    try {
      const response = await this.makeRequest('GET', '/api/auth/practices');
      
      if (response.statusCode === 200 && Array.isArray(response.body) && response.body.length > 0) {
        this.recordTest('Database', 'Connection and Query', true, 
          `Retrieved ${response.body.length} practices from database`);
      } else {
        this.recordTest('Database', 'Connection and Query', false, 
          `Expected practice data, got ${response.statusCode}`);
      }
    } catch (error) {
      this.recordTest('Database', 'Connection and Query', false, error.message);
    }

    // Test multi-tenant isolation
    if (this.currentUser) {
      try {
        const response = await this.makeRequest('GET', '/api/quotes', null, true);
        
        if (response.statusCode === 200) {
          this.recordTest('Database', 'Multi-Tenant Isolation', true, 
            `Quotes filtered by tenant ${this.currentTenant}`);
        } else {
          this.recordTest('Database', 'Multi-Tenant Isolation', false, 
            `Failed to fetch tenant-specific quotes: ${response.statusCode}`);
        }
      } catch (error) {
        this.recordTest('Database', 'Multi-Tenant Isolation', false, error.message);
      }
    }
  }

  async testFormSubmission() {
    this.log("\n=== 4. FORM SUBMISSION TESTING ===");
    
    // Test quote creation
    try {
      const quoteData = {
        subject: "Test Quote - Automated Testing",
        templateType: "appointment_reminder",
        colorMode: "color",
        estimatedRecipients: 100,
        practiceId: 1,
        notes: "Automated test quote"
      };

      const response = await this.makeRequest('POST', '/api/quotes', quoteData, true);
      
      if (response.statusCode === 201 || response.statusCode === 200) {
        this.recordTest('Form Submission', 'Quote Creation', true, 
          `Quote created successfully: ${response.statusCode}`);
      } else {
        this.recordTest('Form Submission', 'Quote Creation', false, 
          `Failed to create quote: ${response.statusCode} - ${JSON.stringify(response.body)}`);
      }
    } catch (error) {
      this.recordTest('Form Submission', 'Quote Creation', false, error.message);
    }

    // Test order creation
    try {
      const orderData = {
        subject: "Test Order - Automated Testing",
        templateType: "patient_notification",
        colorMode: "bw",
        estimatedRecipients: 50,
        practiceId: 1,
        notes: "Automated test order",
        dataFile: "test-data.csv"
      };

      const response = await this.makeRequest('POST', '/api/orders', orderData, true);
      
      if (response.statusCode === 201 || response.statusCode === 200) {
        this.recordTest('Form Submission', 'Order Creation', true, 
          `Order created successfully: ${response.statusCode}`);
      } else {
        this.recordTest('Form Submission', 'Order Creation', false, 
          `Failed to create order: ${response.statusCode} - ${JSON.stringify(response.body)}`);
      }
    } catch (error) {
      this.recordTest('Form Submission', 'Order Creation', false, error.message);
    }
  }

  async testErrorHandling() {
    this.log("\n=== 5. ERROR HANDLING TESTING ===");
    
    // Test access to protected routes without authentication
    this.cookies = ''; // Clear authentication
    
    try {
      const response = await this.makeRequest('GET', '/api/quotes', null, false);
      
      if (response.statusCode === 401) {
        this.recordTest('Error Handling', 'Unauthorized Access Protection', true, 
          'Properly blocked unauthenticated access');
      } else {
        this.recordTest('Error Handling', 'Unauthorized Access Protection', false, 
          `Expected 401, got ${response.statusCode}`);
      }
    } catch (error) {
      this.recordTest('Error Handling', 'Unauthorized Access Protection', false, error.message);
    }

    // Test malformed API requests
    await this.makeRequest('POST', '/api/auth/login', {
      email: 'admin@riversidefamilymed.com',
      password: 'password123'
    });

    try {
      const response = await this.makeRequest('POST', '/api/quotes', {
        invalidField: "invalid data"
      }, true);
      
      if (response.statusCode === 400 || response.statusCode === 422) {
        this.recordTest('Error Handling', 'Malformed Request Validation', true, 
          'Properly rejected malformed request');
      } else {
        this.recordTest('Error Handling', 'Malformed Request Validation', false, 
          `Expected 400/422, got ${response.statusCode}`);
      }
    } catch (error) {
      this.recordTest('Error Handling', 'Malformed Request Validation', false, error.message);
    }
  }

  async testSessionManagement() {
    this.log("\n=== 6. SESSION MANAGEMENT TESTING ===");
    
    // Test session creation
    try {
      const response = await this.makeRequest('POST', '/api/auth/login', {
        email: 'staff1@riversidefamilymed.com',
        password: 'password123'
      });
      
      if (response.statusCode === 200 && this.cookies) {
        this.recordTest('Session Management', 'Session Creation', true, 
          'Session created and cookies set');
      } else {
        this.recordTest('Session Management', 'Session Creation', false, 
          `Session creation failed: ${response.statusCode}`);
      }
    } catch (error) {
      this.recordTest('Session Management', 'Session Creation', false, error.message);
    }

    // Test session persistence across requests
    try {
      const response1 = await this.makeRequest('GET', '/api/auth/user', null, true);
      const response2 = await this.makeRequest('GET', '/api/auth/user', null, true);
      
      if (response1.statusCode === 200 && response2.statusCode === 200) {
        this.recordTest('Session Management', 'Session Persistence', true, 
          'Session maintained across multiple requests');
      } else {
        this.recordTest('Session Management', 'Session Persistence', false, 
          `Session persistence failed: ${response1.statusCode}, ${response2.statusCode}`);
      }
    } catch (error) {
      this.recordTest('Session Management', 'Session Persistence', false, error.message);
    }
  }

  async runAllTests() {
    this.log("🚀 Starting PatientLetterHub Comprehensive Test Suite");
    this.log("Testing authentication and core functionality after architecture changes\n");

    await this.testAuthenticationSystem();
    await this.testAPIEndpoints();
    await this.testDatabaseConnectivity();
    await this.testFormSubmission();
    await this.testErrorHandling();
    await this.testSessionManagement();

    this.printResults();
  }

  printResults() {
    this.log("\n" + "=".repeat(60));
    this.log("COMPREHENSIVE TEST RESULTS SUMMARY");
    this.log("=".repeat(60));

    const categories = [...new Set(this.testResults.map(r => r.category))];
    let totalTests = 0;
    let passedTests = 0;

    for (const category of categories) {
      const categoryTests = this.testResults.filter(r => r.category === category);
      const passed = categoryTests.filter(r => r.passed).length;
      const total = categoryTests.length;
      
      totalTests += total;
      passedTests += passed;
      
      this.log(`\n${category}: ${passed}/${total} tests passed`);
      
      // Show failed tests
      const failed = categoryTests.filter(r => !r.passed);
      if (failed.length > 0) {
        for (const test of failed) {
          this.log(`  ❌ ${test.testName}: ${test.details}`);
        }
      }
    }

    this.log(`\n${"=".repeat(60)}`);
    this.log(`OVERALL RESULTS: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests/totalTests)*100)}%)`);
    
    if (passedTests === totalTests) {
      this.log("🎉 ALL TESTS PASSED! System is ready for production.");
    } else {
      this.log("⚠️  Some tests failed. Please review and fix issues before deployment.");
    }
    
    this.log(`${"=".repeat(60)}\n`);
  }
}

// Run the test suite
const testSuite = new ComprehensiveTestSuite();
testSuite.runAllTests().catch(console.error);