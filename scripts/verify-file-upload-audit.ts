import { prisma } from '@/lib/db';
import { AuditAction, AuditResource } from '@prisma/client';

async function verifyFileUploadAudit() {
  console.log('🔍 Verifying file upload audit logging...\n');
  
  // Check for file upload logs
  const uploadLogs = await prisma.auditLog.findMany({
    where: {
      action: AuditAction.UPLOAD,
      resource: AuditResource.ORDER_FILE,
    },
    orderBy: { timestamp: 'desc' },
    take: 10,
  });
  
  console.log(`Found ${uploadLogs.length} file upload logs\n`);
  
  if (uploadLogs.length === 0) {
    console.log('⚠️  No upload logs found. Try uploading a file first.');
    return;
  }
  
  // Check latest upload
  const latest = uploadLogs[0];
  console.log('Latest upload log:');
  console.log('  User:', latest.userEmail || 'Unknown');
  console.log('  Action:', latest.action);
  console.log('  Success:', latest.success ? '✅' : '❌');
  console.log('  Contains PHI:', latest.containsPHI ? '✅' : '❌');
  console.log('  Severity:', latest.severity);
  console.log('  IP Address:', latest.ipAddress);
  console.log('  Description:', latest.description);
  console.log('  Timestamp:', latest.timestamp);
  
  // Check for required fields
  const checks = [
    { name: 'User ID', value: latest.userId, required: latest.success },
    { name: 'User Email', value: latest.userEmail, required: latest.success },
    { name: 'IP Address', value: latest.ipAddress, required: true },
    { name: 'User Agent', value: latest.userAgent, required: true },
    { name: 'Resource ID', value: latest.resourceId, required: latest.success },
    { name: 'Description', value: latest.description, required: true },
    { name: 'Contains PHI', value: latest.containsPHI, required: true },
  ];
  
  console.log('\n📋 Field validation:');
  let allValid = true;
  
  checks.forEach(check => {
    const isValid = check.required ? !!check.value : true;
    const status = isValid ? '✅' : '❌';
    console.log(`  ${status} ${check.name}: ${check.value || 'MISSING'}`);
    if (!isValid) allValid = false;
  });
  
  // Check for failed uploads
  const failedUploads = uploadLogs.filter(log => !log.success);
  console.log(`\n⚠️  Failed uploads logged: ${failedUploads.length}`);
  
  if (failedUploads.length > 0) {
    console.log('Recent failures:');
    failedUploads.slice(0, 3).forEach(log => {
      console.log(`  - ${log.errorMessage} (${new Date(log.timestamp).toLocaleString()})`);
    });
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  if (allValid && uploadLogs.length > 0) {
    console.log('✅ File upload audit logging is working correctly!');
  } else {
    console.log('⚠️  Some issues detected. Review logs above.');
  }
  console.log('='.repeat(50) + '\n');
}

verifyFileUploadAudit()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  });
