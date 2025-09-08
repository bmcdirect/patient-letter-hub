#!/usr/bin/env tsx

import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || 'whsec_test_secret';
const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/clerk';

// Test webhook signature generation
function generateTestSignature(payload: string, secret: string) {
  const webhook = new Webhook(secret);
  const timestamp = Math.floor(Date.now() / 1000);
  const svixId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Note: In a real test, you'd need to properly sign the payload
  // This is a simplified version for testing
  return {
    'svix-id': svixId,
    'svix-timestamp': timestamp.toString(),
    'svix-signature': 'test_signature' // In real implementation, this would be properly calculated
  };
}

// Test user.created event
async function testUserCreated() {
  console.log('🧪 Testing user.created webhook...');
  
  const event: WebhookEvent = {
    type: 'user.created',
    data: {
      id: 'user_test_' + Date.now(),
      email_addresses: [
        {
          id: 'email_test',
          email_address: 'test@example.com',
          verification: { status: 'verified' }
        }
      ],
      first_name: 'Test',
      last_name: 'User',
      created_at: Date.now(),
      updated_at: Date.now()
    }
  };

  const payload = JSON.stringify(event);
  const headers = generateTestSignature(payload, WEBHOOK_SECRET);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: payload
    });

    const result = await response.json();
    console.log('✅ user.created test result:', {
      status: response.status,
      success: result.success,
      eventType: result.eventType
    });
  } catch (error) {
    console.error('❌ user.created test failed:', error.message);
  }
}

// Test user.updated event
async function testUserUpdated() {
  console.log('🧪 Testing user.updated webhook...');
  
  const event: WebhookEvent = {
    type: 'user.updated',
    data: {
      id: 'user_test_' + Date.now(),
      email_addresses: [
        {
          id: 'email_test',
          email_address: 'updated@example.com',
          verification: { status: 'verified' }
        }
      ],
      first_name: 'Updated',
      last_name: 'User',
      created_at: Date.now() - 86400000, // 1 day ago
      updated_at: Date.now()
    }
  };

  const payload = JSON.stringify(event);
  const headers = generateTestSignature(payload, WEBHOOK_SECRET);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: payload
    });

    const result = await response.json();
    console.log('✅ user.updated test result:', {
      status: response.status,
      success: result.success,
      eventType: result.eventType
    });
  } catch (error) {
    console.error('❌ user.updated test failed:', error.message);
  }
}

// Test user.deleted event
async function testUserDeleted() {
  console.log('🧪 Testing user.deleted webhook...');
  
  const event: WebhookEvent = {
    type: 'user.deleted',
    data: {
      id: 'user_test_' + Date.now(),
      deleted: true
    }
  };

  const payload = JSON.stringify(event);
  const headers = generateTestSignature(payload, WEBHOOK_SECRET);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: payload
    });

    const result = await response.json();
    console.log('✅ user.deleted test result:', {
      status: response.status,
      success: result.success,
      eventType: result.eventType
    });
  } catch (error) {
    console.error('❌ user.deleted test failed:', error.message);
  }
}

// Test health check
async function testHealthCheck() {
  console.log('🧪 Testing webhook health check...');
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'GET'
    });

    const result = await response.json();
    console.log('✅ Health check result:', result);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
}

// Test invalid signature
async function testInvalidSignature() {
  console.log('🧪 Testing invalid signature handling...');
  
  const event: WebhookEvent = {
    type: 'user.created',
    data: {
      id: 'user_test_invalid',
      email_addresses: [
        {
          id: 'email_test',
          email_address: 'invalid@example.com',
          verification: { status: 'verified' }
        }
      ],
      first_name: 'Invalid',
      last_name: 'Test',
      created_at: Date.now(),
      updated_at: Date.now()
    }
  };

  const payload = JSON.stringify(event);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'svix-id': 'invalid_id',
        'svix-timestamp': 'invalid_timestamp',
        'svix-signature': 'invalid_signature'
      },
      body: payload
    });

    const result = await response.json();
    console.log('✅ Invalid signature test result:', {
      status: response.status,
      error: result.error,
      expected: 'Should return 401 Unauthorized'
    });
  } catch (error) {
    console.error('❌ Invalid signature test failed:', error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Clerk Webhook Tests...');
  console.log(`📡 Webhook URL: ${WEBHOOK_URL}`);
  console.log(`🔑 Using secret: ${WEBHOOK_SECRET.substring(0, 10)}...`);
  console.log('');

  await testHealthCheck();
  console.log('');
  
  await testUserCreated();
  console.log('');
  
  await testUserUpdated();
  console.log('');
  
  await testUserDeleted();
  console.log('');
  
  await testInvalidSignature();
  console.log('');

  console.log('✅ All webhook tests completed!');
  console.log('');
  console.log('📝 Note: These tests use mock signatures and may fail signature verification.');
  console.log('   For production testing, use actual Clerk webhook events with real signatures.');
}

runTests().catch(console.error);
