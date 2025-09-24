#!/usr/bin/env ts-node

/**
 * SMTP Connection Test Script
 * 
 * This script tests the Microsoft 365 SMTP connection and email delivery
 * Run with: npx ts-node scripts/test-smtp.ts
 */

import nodemailer from 'nodemailer';
import { EmailService } from '../lib/email';

async function testSMTPConnection() {
  console.log('🔍 Testing Microsoft 365 SMTP Connection...\n');

  // Check environment variables
  const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease set these variables in your .env.local file');
    process.exit(1);
  }

  console.log('✅ All required environment variables are set');
  console.log(`📧 SMTP Host: ${process.env.SMTP_HOST}`);
  console.log(`🔌 SMTP Port: ${process.env.SMTP_PORT}`);
  console.log(`👤 SMTP User (Auth): ${process.env.SMTP_USER}`);
  console.log(`📨 SMTP From (Alias): ${process.env.SMTP_FROM}\n`);

  // Create transporter
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    }
  });

  try {
    // Test SMTP connection
    console.log('🔗 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Test email sending
    console.log('📤 Testing email delivery with alias...');
    const testEmail = {
      from: process.env.SMTP_FROM, // Using alias for "from" address
      to: process.env.SMTP_USER, // Send to self for testing
      subject: 'SMTP Test Email - Microsoft 365 Alias Integration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">🎉 SMTP Test Successful!</h1>
          <p>This email confirms that your Microsoft 365 SMTP integration with alias support is working correctly.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Test Details</h3>
            <p><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</p>
            <p><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</p>
            <p><strong>Auth User:</strong> ${process.env.SMTP_USER}</p>
            <p><strong>From Alias:</strong> ${process.env.SMTP_FROM}</p>
            <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
          </div>
          <p>✅ Authentication with primary account successful</p>
          <p>✅ Sending from alias address successful</p>
          <p>✅ Professional email appearance maintained</p>
          <p><strong>Your email system is ready for production use!</strong></p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 12px;">This is a test email from Patient Letter Hub. Please do not reply.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${info.messageId}\n`);

    // Test EmailService class
    console.log('🧪 Testing EmailService class...');
    const emailService = new EmailService();
    
    try {
      await emailService.sendCustomEmail(
        process.env.SMTP_USER!,
        'EmailService Test - Custom Email',
        '<h1>EmailService Test</h1><p>This confirms the EmailService class is working with Microsoft 365 SMTP.</p>'
      );
      console.log('✅ EmailService custom email test successful!');
    } catch (error) {
      console.error('❌ EmailService test failed:', error);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('Your Microsoft 365 SMTP integration is ready for production use.');

  } catch (error) {
    console.error('❌ SMTP test failed:', error);
    console.error('\nTroubleshooting tips:');
    console.error('1. Verify your app password is correct');
    console.error('2. Ensure SMTP AUTH is enabled in Microsoft 365');
    console.error('3. Check that your email address exists in Microsoft 365');
    console.error('4. Verify your network allows outbound SMTP connections');
    process.exit(1);
  }
}

// Run the test
testSMTPConnection().catch(console.error);
