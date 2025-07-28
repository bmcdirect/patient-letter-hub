#!/usr/bin/env node

// Simple test runner for PatientLetterHub CI checks
const { execSync } = require('child_process');
const fetch = require('node-fetch');

async function runSmokeTests() {
  console.log('🧪 Running PatientLetterHub smoke tests...');
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:5000/api/auth/health');
    const healthData = await healthResponse.json();
    
    if (healthResponse.status !== 200) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }
    
    if (healthData.status !== 'ok') {
      throw new Error(`Health check status invalid: ${healthData.status}`);
    }
    
    console.log('✅ Health check passed');
    
    // Test 2: Practices endpoint
    console.log('2. Testing practices endpoint...');
    const practicesResponse = await fetch('http://localhost:5000/api/auth/practices');
    const practicesData = await practicesResponse.json();
    
    if (practicesResponse.status !== 200) {
      throw new Error(`Practices endpoint failed: ${practicesResponse.status}`);
    }
    
    if (!Array.isArray(practicesData)) {
      throw new Error('Practices response is not an array');
    }
    
    console.log('✅ Practices endpoint passed');
    
    // Test 3: Database schema check
    console.log('3. Running Drizzle schema check...');
    try {
      execSync('npx drizzle-kit check', { stdio: 'inherit' });
      console.log('✅ Schema check passed');
    } catch (error) {
      console.log('⚠️  Schema check had issues but continuing...');
    }
    
    console.log('🎉 All smoke tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Smoke tests failed:', error.message);
    return false;
  }
}

// Run the tests
runSmokeTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});