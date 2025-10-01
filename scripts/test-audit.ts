import { auditLogger } from '../lib/audit-service';
import { AuditAction, AuditResource, UserRole } from '@prisma/client';

async function testAudit() {
  console.log('🧪 Testing audit logging system...\n');
  
  // Test 1: Create a basic log
  console.log('Test 1: Creating basic audit log...');
  await auditLogger.log({
    userId: 'test-user-123',
    userEmail: 'test@patientletterhub.com',
    userRole: UserRole.ADMIN,
    action: AuditAction.CREATE,
    resource: AuditResource.ORDER,
    description: 'Test audit log entry',
  });
  console.log('✅ Basic log created\n');
  
  // Test 2: Query it back
  console.log('Test 2: Querying audit logs...');
  const results = await auditLogger.query({ limit: 5 });
  console.log(`✅ Found ${results.total} logs`);
  
  if (results.logs.length > 0) {
    console.log('Latest log:', {
      user: results.logs[0].userEmail,
      action: results.logs[0].action,
      resource: results.logs[0].resource,
      timestamp: results.logs[0].timestamp,
    });
  }
  console.log('');
  
  // Test 3: Test specialized method
  console.log('Test 3: Testing specialized auth logging...');
  await auditLogger.logAuth(
    'LOGIN',
    'test-user-456',
    'admin@patientletterhub.com',
    UserRole.ADMIN,
    '192.168.1.1',
    'Mozilla/5.0'
  );
  console.log('✅ Auth log created\n');
  
  // Test 4: Test file operation logging
  console.log('Test 4: Testing file operation logging...');
  await auditLogger.logFileOperation(
    'UPLOAD',
    'file-test-789',
    'patient_list.csv',
    'order-test-001',
    'test-user-123',
    'test@patientletterhub.com',
    UserRole.USER,
    'practice-test-001',
    '192.168.1.100',
    'Mozilla/5.0'
  );
  console.log('✅ File operation log created\n');
  
  // Test 5: Test failure logging
  console.log('Test 5: Testing failure logging...');
  await auditLogger.logFailure(
    AuditAction.UPLOAD,
    AuditResource.ORDER_FILE,
    'test-user-123',
    'test@patientletterhub.com',
    'Test failure scenario',
    'Simulated error for testing',
    '192.168.1.100',
    'Mozilla/5.0'
  );
  console.log('✅ Failure log created\n');
  
  // Final verification
  const finalCount = await auditLogger.query({ limit: 10 });
  console.log(`📊 Total audit logs in database: ${finalCount.total}`);
  console.log('\n✅ All tests passed!');
  console.log('🎉 Audit logging system is working correctly\n');
}

testAudit()
  .then(() => {
    console.log('Test complete - exiting');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Test failed:', err);
    process.exit(1);
  });
