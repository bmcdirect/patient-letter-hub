import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testProofingWorkflow() {
  try {
    console.log('🧪 Testing complete proofing workflow...');
    
    // 1. Check current setup
    console.log('\n1. Current Setup Verification:');
    console.log('=============================');
    
    const users = await prisma.user.findMany({
      include: { practice: true }
    });
    
    const superAdmin = users.find(u => u.email === 'superadmin@masscomminc.com');
    const daveUser = users.find(u => u.email === 'daves@masscomminc.com');
    const riversideAdmin = users.find(u => u.email === 'admin.riverside@riversidefamilymedicine.com');
    const brightSmilesAdmin = users.find(u => u.email === 'admin.brightsmiles@brightsmilesdental.com');
    
    console.log(`✅ SuperAdmin: ${superAdmin ? superAdmin.email : '❌ Missing'}`);
    console.log(`✅ Riverside User: ${daveUser ? daveUser.email : '❌ Missing'}`);
    console.log(`✅ Riverside Admin: ${riversideAdmin ? riversideAdmin.email : '❌ Missing'}`);
    console.log(`✅ Bright Smiles Admin: ${brightSmilesAdmin ? brightSmilesAdmin.email : '❌ Missing'}`);
    
    // 2. Check existing orders and quotes
    console.log('\n2. Existing Data Check:');
    console.log('======================');
    
    const orders = await prisma.orders.findMany({
      include: { practice: true, user: true }
    });
    
    const quotes = await prisma.quotes.findMany({
      include: { practice: true, user: true }
    });
    
    console.log(`📊 Orders: ${orders.length} total`);
    orders.forEach(order => {
      console.log(`   - ${order.orderNumber} (${order.status}) - ${order.practice?.name} - ${order.user.email}`);
    });
    
    console.log(`📊 Quotes: ${quotes.length} total`);
    quotes.forEach(quote => {
      console.log(`   - ${quote.quoteNumber} (${quote.status}) - ${quote.practice?.name} - ${quote.user.email}`);
    });
    
    // 3. Test multi-tenant isolation
    console.log('\n3. Multi-Tenant Isolation Test:');
    console.log('===============================');
    
    const riversideOrders = orders.filter(o => o.practice?.name?.includes('Riverside'));
    const brightSmilesOrders = orders.filter(o => o.practice?.name?.includes('Bright Smiles'));
    
    console.log(`✅ Riverside Orders: ${riversideOrders.length}`);
    console.log(`✅ Bright Smiles Orders: ${brightSmilesOrders.length}`);
    
    // 4. Check proof-related functionality
    console.log('\n4. Proof Workflow Components:');
    console.log('============================');
    
    const proofFiles = await prisma.orderFiles.findMany({
      where: { fileType: 'admin-proof' },
      include: { order: { include: { practice: true } } }
    });
    
    const approvals = await prisma.orderApprovals.findMany({
      include: { order: { include: { practice: true } } }
    });
    
    console.log(`✅ Proof Files: ${proofFiles.length} total`);
    proofFiles.forEach(file => {
      console.log(`   - ${file.fileName} for order ${file.order.orderNumber} (${file.order.practice?.name})`);
    });
    
    console.log(`✅ Approval Records: ${approvals.length} total`);
    approvals.forEach(approval => {
      console.log(`   - Order ${approval.order.orderNumber} (${approval.order.practice?.name}) - Revision ${approval.revision} - Status: ${approval.status}`);
    });
    
    // 5. Test scenarios summary
    console.log('\n5. Test Scenarios Summary:');
    console.log('==========================');
    console.log('🎯 Scenario 1: SuperAdmin Access');
    console.log('   - Login: superadmin@masscomminc.com');
    console.log('   - Access: /admin dashboard');
    console.log('   - Capability: View all orders from all practices');
    console.log('   - Action: Process proofs, manage status, upload admin files');
    
    console.log('\n🎯 Scenario 2: Riverside Practice User');
    console.log('   - Login: daves@masscomminc.com');
    console.log('   - Access: /dashboard');
    console.log('   - Capability: View only Riverside orders');
    console.log('   - Action: Create orders, upload customer files, approve proofs');
    
    console.log('\n🎯 Scenario 3: Riverside Practice Admin');
    console.log('   - Login: admin.riverside@riversidefamilymedicine.com');
    console.log('   - Access: /admin (practice-scoped)');
    console.log('   - Capability: View and manage Riverside orders');
    console.log('   - Action: Process orders, upload proofs, manage status');
    
    console.log('\n🎯 Scenario 4: Bright Smiles Practice Admin');
    console.log('   - Login: admin.brightsmiles@brightsmilesdental.com');
    console.log('   - Access: /admin (practice-scoped)');
    console.log('   - Capability: View and manage Bright Smiles orders');
    console.log('   - Action: Process orders, upload proofs, manage status');
    
    // 6. Workflow testing checklist
    console.log('\n6. End-to-End Workflow Testing Checklist:');
    console.log('=========================================');
    console.log('📋 Customer Workflow:');
    console.log('   □ Login as daves@masscomminc.com (Riverside practice user)');
    console.log('   □ Create a new quote (/quotes/create)');
    console.log('   □ Upload customer files (PDF letter + CSV data)');
    console.log('   □ Convert quote to order');
    console.log('   □ Check order appears in /orders');
    
    console.log('\n📋 Admin Workflow:');
    console.log('   □ Login as superadmin@masscomminc.com');
    console.log('   □ Access /admin dashboard');
    console.log('   □ View all orders from both practices');
    console.log('   □ Process an order (change status to "in-progress")');
    console.log('   □ Upload admin proof files');
    console.log('   □ Send proof to customer for approval');
    
    console.log('\n📋 Proof Approval Workflow:');
    console.log('   □ Login as daves@masscomminc.com');
    console.log('   □ Check for proof review notification');
    console.log('   □ Access proof review page (/orders/[id]/proof-review)');
    console.log('   □ Review uploaded proof files');
    console.log('   □ Approve or request changes');
    
    console.log('\n📋 Multi-Tenant Isolation:');
    console.log('   □ Verify daves@masscomminc.com only sees Riverside orders');
    console.log('   □ Verify superadmin@masscomminc.com sees all orders');
    console.log('   □ Verify admin.brightsmiles@brightsmilesdental.com only sees Bright Smiles orders');
    
    // 7. Data validation
    console.log('\n7. Data Validation:');
    console.log('==================');
    
    const practices = await prisma.practice.findMany({
      include: { users: true, orders: true, quotes: true }
    });
    
    practices.forEach(practice => {
      console.log(`✅ ${practice.name}:`);
      console.log(`   - Users: ${practice.users.length}`);
      console.log(`   - Orders: ${practice.orders.length}`);
      console.log(`   - Quotes: ${practice.quotes.length}`);
    });
    
    console.log('\n🎉 Testing Setup Complete!');
    console.log('==========================');
    console.log('Ready for end-to-end proofing workflow testing.');
    console.log('\n📝 Next Steps:');
    console.log('1. Create superadmin@masscomminc.com in Clerk dashboard');
    console.log('2. Test login with each user account');
    console.log('3. Execute the workflow testing checklist above');
    console.log('4. Verify multi-tenant isolation works correctly');
    console.log('5. Test complete proofing workflow end-to-end');
    
  } catch (error) {
    console.error('❌ Error testing proofing workflow:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProofingWorkflow();
