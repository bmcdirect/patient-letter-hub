#!/usr/bin/env node

/**
 * PatientLetterHub Security Verification Script
 * Verifies all production security hardening implementations
 */

import fs from 'fs';
import path from 'path';

class SecurityVerifier {
  constructor() {
    this.results = [];
  }

  log(category, test, status, details = '') {
    const result = { category, test, status, details };
    this.results.push(result);
    const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${statusIcon} [${category}] ${test}${details ? ` - ${details}` : ''}`);
  }

  verifyFileExists(filePath, category, description) {
    const exists = fs.existsSync(filePath);
    this.log(category, description, exists ? 'PASS' : 'FAIL', exists ? '' : `File missing: ${filePath}`);
    return exists;
  }

  verifyFileContent(filePath, searchPattern, category, description) {
    try {
      if (!fs.existsSync(filePath)) {
        this.log(category, description, 'FAIL', `File not found: ${filePath}`);
        return false;
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      const hasPattern = searchPattern.test(content);
      this.log(category, description, hasPattern ? 'PASS' : 'FAIL', 
        hasPattern ? '' : `Pattern not found in ${filePath}`);
      return hasPattern;
    } catch (error) {
      this.log(category, description, 'FAIL', `Error reading ${filePath}: ${error.message}`);
      return false;
    }
  }

  verifyEnvironmentFile() {
    const envExists = this.verifyFileExists('.env.example', 'Environment', 'Environment configuration file exists');
    
    if (envExists) {
      const envContent = fs.readFileSync('.env.example', 'utf8');
      const requiredVars = [
        'DATABASE_URL', 'SESSION_SECRET', 'NODE_ENV', 
        'ALLOWED_ORIGINS', 'RESEND_API_KEY', 'MAX_FILE_SIZE'
      ];
      
      requiredVars.forEach(varName => {
        const hasVar = envContent.includes(varName);
        this.log('Environment', `${varName} documented`, hasVar ? 'PASS' : 'FAIL');
      });
    }
  }

  verifyDatabaseSecurity() {
    this.verifyFileContent(
      'server/db.ts',
      /DATABASE_URL environment variable is required in production/,
      'Database',
      'Production DATABASE_URL validation'
    );
    
    this.verifyFileContent(
      'server/db.ts',
      /PostgreSQL connection string/,
      'Database',
      'PostgreSQL format validation'
    );
  }

  verifySessionSecurity() {
    this.verifyFileContent(
      'server/tempAuth.ts',
      /SESSION_SECRET environment variable is required in production/,
      'Session',
      'Production SESSION_SECRET requirement'
    );
    
    this.verifyFileContent(
      'server/tempAuth.ts',
      /secure: process\.env\.NODE_ENV === 'production'/,
      'Session',
      'Auto-secure cookies for production'
    );
    
    this.verifyFileContent(
      'server/replitAuth.ts',
      /secure: process\.env\.NODE_ENV === 'production'/,
      'Session',
      'Replit Auth secure cookies'
    );
  }

  verifyCORSSecurity() {
    this.verifyFileContent(
      'server/index.ts',
      /configureSecureCORS/,
      'CORS',
      'Secure CORS configuration function'
    );
    
    this.verifyFileContent(
      'server/index.ts',
      /ALLOWED_ORIGINS/,
      'CORS',
      'Environment-based origin validation'
    );
    
    this.verifyFileContent(
      'server/index.ts',
      /Strict-Transport-Security/,
      'CORS',
      'HSTS header for production'
    );
  }

  verifyFileUploadSecurity() {
    this.verifyFileContent(
      'server/routes.ts',
      /dangerousExtensions/,
      'File Upload',
      'Dangerous extension blocking'
    );
    
    this.verifyFileContent(
      'server/routes.ts',
      /MAX_FILE_SIZE/,
      'File Upload',
      'Configurable file size limits'
    );
    
    this.verifyFileContent(
      'server/routes.ts',
      /Security: Invalid file type/,
      'File Upload',
      'Security error messages'
    );
  }

  verifySecurityMiddleware() {
    this.verifyFileExists(
      'server/middleware/security.ts',
      'Middleware',
      'Security middleware file'
    );
    
    this.verifyFileExists(
      'server/middleware/validation.ts',
      'Middleware',
      'Validation middleware file'
    );
    
    this.verifyFileContent(
      'server/middleware/security.ts',
      /X-Content-Type-Options/,
      'Middleware',
      'Security headers implementation'
    );
    
    this.verifyFileContent(
      'server/middleware/validation.ts',
      /rateLimiter/,
      'Middleware',
      'Rate limiting implementation'
    );
  }

  verifyEmailSecurity() {
    this.verifyFileContent(
      'server/services/emailService.ts',
      /RESEND_API_KEY/,
      'Email',
      'Environment-based API key configuration'
    );
  }

  verifyDocumentation() {
    this.verifyFileExists(
      'production-security-checklist.md',
      'Documentation',
      'Security implementation checklist'
    );
    
    this.verifyFileContent(
      'replit.md',
      /PRODUCTION SECURITY HARDENING COMPLETED/,
      'Documentation',
      'Security changes documented in replit.md'
    );
  }

  runAllVerifications() {
    console.log('🔒 PatientLetterHub Security Verification\n');
    
    this.verifyEnvironmentFile();
    this.verifyDatabaseSecurity();
    this.verifySessionSecurity();
    this.verifyCORSSecurity();
    this.verifyFileUploadSecurity();
    this.verifySecurityMiddleware();
    this.verifyEmailSecurity();
    this.verifyDocumentation();
    
    this.printSummary();
  }

  printSummary() {
    console.log('\n📊 VERIFICATION SUMMARY');
    console.log('========================');
    
    const categories = [...new Set(this.results.map(r => r.category))];
    let totalTests = 0;
    let totalPassed = 0;
    
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      const passed = categoryResults.filter(r => r.status === 'PASS').length;
      const total = categoryResults.length;
      
      totalTests += total;
      totalPassed += passed;
      
      const percentage = Math.round((passed / total) * 100);
      console.log(`${category}: ${passed}/${total} (${percentage}%)`);
    });
    
    const overallPercentage = Math.round((totalPassed / totalTests) * 100);
    console.log(`\nOVERALL: ${totalPassed}/${totalTests} (${overallPercentage}%)`);
    
    if (overallPercentage >= 90) {
      console.log('\n🎉 SECURITY VERIFICATION PASSED - Ready for production deployment!');
    } else if (overallPercentage >= 75) {
      console.log('\n⚠️  SECURITY VERIFICATION PARTIAL - Review failed checks before deployment');
    } else {
      console.log('\n❌ SECURITY VERIFICATION FAILED - Critical security issues must be resolved');
    }
    
    // Show any failed tests
    const failedTests = this.results.filter(r => r.status === 'FAIL');
    if (failedTests.length > 0) {
      console.log('\n❌ FAILED CHECKS:');
      failedTests.forEach(test => {
        console.log(`   - [${test.category}] ${test.test}: ${test.details}`);
      });
    }
  }
}

// Run verification
const verifier = new SecurityVerifier();
verifier.runAllVerifications();