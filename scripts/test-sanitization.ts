import { auditLogger } from '../lib/audit-service';
import { AuditAction, AuditResource, UserRole } from '@prisma/client';

async function testSanitization() {
  console.log('Testing data sanitization...\n');
  
  // Test that sensitive data is redacted
  await auditLogger.log({
    userId: 'test-user',
    userEmail: 'test@example.com',
    userRole: UserRole.ADMIN,
    action: AuditAction.UPDATE,
    resource: AuditResource.USER,
    description: 'Test sanitization',
    beforeData: {
      name: 'John Doe',
      password: 'secret123',  // Should be redacted
      apiKey: 'key-abc',      // Should be redacted
      email: 'john@example.com'  // Should NOT be redacted
    },
    afterData: {
      name: 'John Doe',
      password: 'newsecret456',  // Should be redacted
      apiKey: 'key-xyz',         // Should be redacted
      email: 'john@example.com'  // Should NOT be redacted
    }
  });
  
  console.log('✅ Sanitization test completed');
  console.log('Check Prisma Studio - password and apiKey should be [REDACTED]');
}

testSanitization()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });
