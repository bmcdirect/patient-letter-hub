#!/usr/bin/env node

/**
 * Same-Origin Smoke Test - Verify single-origin deployment
 * Tests cookie persistence, authentication, and API functionality
 */

import http from 'http';
import https from 'https';
import querystring from 'querystring';

class SameOriginSmokeTest {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.cookies = '';
    this.results = [];
  }

  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  recordResult(test, passed, details = '') {
    this.results.push({ test, passed, details });
    const status = passed ? '✅ PASS' : '❌ FAIL';
    this.log(`${status}: ${test}${details ? ` - ${details}` : ''}`);
  }

  async makeRequest(method, path, data = null, parseJson = true) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SameOriginSmokeTest/1.0'
        }
      };

      // Add cookies if we have them
      if (this.cookies) {
        options.headers['Cookie'] = this.cookies;
      }

      const req = http.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          // Extract cookies from response
          const setCookieHeader = res.headers['set-cookie'];
          if (setCookieHeader) {
            console.log('Set-Cookie headers:', setCookieHeader);
            this.cookies = setCookieHeader.map(cookie => cookie.split(';')[0]).join('; ');
            console.log('Extracted cookies:', this.cookies);
          }

          let parsedData = responseData;
          if (parseJson && responseData) {
            try {
              parsedData = JSON.parse(responseData);
            } catch (e) {
              // If parsing fails, keep as string
            }
          }

          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData,
            cookies: this.cookies
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

  async testSingleOriginCookie() {
    this.log('Testing single-origin cookie behavior...');
    
    // Test login and cookie persistence
    const loginResponse = await this.makeRequest('POST', '/api/auth/login', {
      email: 'admin@riversidefamilymed.com',
      password: 'password123'
    });

    if (loginResponse.status === 200) {
      this.recordResult('Cookie - Login sets session cookie', true, 'Session cookie received');
      
      // Test that cookie persists to next request
      const userResponse = await this.makeRequest('GET', '/api/auth/user');
      
      if (userResponse.status === 200) {
        this.recordResult('Cookie - Session persistence', true, 'Session cookie persisted');
        return true;
      } else {
        this.recordResult('Cookie - Session persistence', false, `Got ${userResponse.status} instead of 200`);
        return false;
      }
    } else {
      this.recordResult('Cookie - Login sets session cookie', false, `Login failed: ${loginResponse.status}`);
      return false;
    }
  }

  async testAPIEndpoints() {
    this.log('Testing API endpoints...');
    
    const endpoints = [
      { path: '/api/auth/user', name: 'User endpoint' },
      { path: '/api/quotes', name: 'Quotes endpoint' },
      { path: '/api/orders', name: 'Orders endpoint' },
      { path: '/api/dashboard/stats', name: 'Dashboard stats' }
    ];

    for (const endpoint of endpoints) {
      const response = await this.makeRequest('GET', endpoint.path);
      const passed = response.status === 200;
      this.recordResult(
        `API - ${endpoint.name}`,
        passed,
        `Status: ${response.status}`
      );
    }
  }

  async testCORSHeaders() {
    this.log('Testing CORS headers...');
    
    const response = await this.makeRequest('GET', '/api/auth/user');
    const headers = response.headers;
    
    // Check that there's no Access-Control-Allow-Origin: * header
    const corsOrigin = headers['access-control-allow-origin'];
    const noCorsWildcard = !corsOrigin || corsOrigin !== '*';
    
    this.recordResult(
      'CORS - No wildcard origin',
      noCorsWildcard,
      corsOrigin ? `Origin: ${corsOrigin}` : 'No CORS origin header'
    );

    // Check that credentials are allowed
    const corsCredentials = headers['access-control-allow-credentials'];
    const credentialsAllowed = corsCredentials === 'true';
    
    this.recordResult(
      'CORS - Credentials allowed',
      credentialsAllowed,
      `Credentials: ${corsCredentials}`
    );
  }

  async testOrderCreation() {
    this.log('Testing order creation with files...');
    
    const orderData = {
      practiceId: 1,
      subject: 'Test Order Creation',
      templateType: 'letter',
      colorMode: 'color',
      recipientCount: 5,
      preferredMailDate: '2025-07-20'
    };

    const response = await this.makeRequest('POST', '/api/orders', orderData);
    const passed = response.status === 201;
    
    this.recordResult(
      'Order - Creation',
      passed,
      `Status: ${response.status}${response.data?.id ? `, ID: ${response.data.id}` : ''}`
    );
  }

  async runAllTests() {
    this.log('🚀 Starting Same-Origin Smoke Test');
    this.log('=======================================');

    const authenticated = await this.testSingleOriginCookie();
    
    if (authenticated) {
      await this.testAPIEndpoints();
      await this.testOrderCreation();
    }
    
    await this.testCORSHeaders();
    
    this.printResults();
  }

  printResults() {
    this.log('\n=======================================');
    this.log('SAME-ORIGIN SMOKE TEST RESULTS');
    this.log('=======================================');
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      this.log(`${status} ${result.test}`);
      if (result.details) {
        this.log(`   └─ ${result.details}`);
      }
    });
    
    this.log(`\n📊 SUMMARY: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);
    
    if (passed === total) {
      this.log('🎉 All tests passed! Same-origin deployment is working correctly.');
    } else {
      this.log('⚠️  Some tests failed. Please review the issues above.');
    }
  }
}

// Run the test
const test = new SameOriginSmokeTest();
test.runAllTests().catch(console.error);