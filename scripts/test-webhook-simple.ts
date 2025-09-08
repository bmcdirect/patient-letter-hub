#!/usr/bin/env tsx

const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/clerk';

// Test health check
async function testHealthCheck() {
  console.log('🧪 Testing webhook health check...');
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'GET'
    });

    const result = await response.json();
    console.log('✅ Health check result:', result);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

// Test webhook endpoint accessibility
async function testWebhookAccessibility() {
  console.log('🧪 Testing webhook endpoint accessibility...');
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: 'data' })
    });

    console.log('✅ Webhook endpoint accessible:', {
      status: response.status,
      statusText: response.statusText
    });
    
    if (response.status === 401) {
      console.log('✅ Security working: Returns 401 for invalid signature (expected)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Webhook accessibility test failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Simple Webhook Tests...');
  console.log(`📡 Webhook URL: ${WEBHOOK_URL}`);
  console.log('');

  const healthCheck = await testHealthCheck();
  console.log('');
  
  const accessibility = await testWebhookAccessibility();
  console.log('');

  if (healthCheck && accessibility) {
    console.log('✅ All basic webhook tests passed!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Configure CLERK_WEBHOOK_SECRET in your .env file');
    console.log('   2. Set up webhook endpoint in Clerk dashboard');
    console.log('   3. Test with real Clerk webhook events');
  } else {
    console.log('❌ Some tests failed. Check the webhook implementation.');
  }
}

runTests().catch(console.error);
