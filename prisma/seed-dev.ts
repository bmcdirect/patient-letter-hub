/**
 * Comprehensive Development Database Seed Script
 * 
 * This script creates a complete development environment with:
 * - 3 test practices with realistic data
 * - 5 test users (2 ADMIN, 3 USER)
 * - 15 test orders across practices
 * - 20 OrderFiles with dummy data
 * - 10 Proofs with various statuses
 * - 25 OrderStatusHistory entries
 * - 15 EmailNotifications
 * - 5 Quotes
 * 
 * IMPORTANT: This script DELETES ALL EXISTING DATA first!
 * Only run this against development databases.
 */

import { PrismaClient, UserRole, ProofStatus, AuditAction, AuditResource, AuditSeverity, Practice, User, Orders, OrderFiles, Proof, OrderStatusHistory, EmailNotifications, Quotes, Invoices, AuditLog } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to generate dummy file data
function generateDummyFileData(): Buffer {
  const dummyContent = 'This is dummy file content for testing purposes. ' +
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
    'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
  return Buffer.from(dummyContent, 'utf8');
}

// Helper function to generate order numbers
function generateOrderNumber(index: number): string {
  const year = new Date().getFullYear();
  const paddedIndex = String(index).padStart(4, '0');
  return `ORD-${year}-${paddedIndex}`;
}

// Helper function to generate quote numbers
function generateQuoteNumber(index: number): string {
  const year = new Date().getFullYear();
  const paddedIndex = String(index).padStart(4, '0');
  return `QUO-${year}-${paddedIndex}`;
}

// Helper function to generate invoice numbers
function generateInvoiceNumber(index: number): string {
  const year = new Date().getFullYear();
  const paddedIndex = String(index).padStart(4, '0');
  return `INV-${year}-${paddedIndex}`;
}

async function main() {
  console.log('🌱 Starting comprehensive development seed process...');
  console.log('⚠️  WARNING: This will DELETE ALL EXISTING DATA!');

  // Add type annotations
  const createdPractices: Practice[] = [];
  const createdUsers: User[] = [];
  const createdOrders: Orders[] = [];
  const createdOrderFiles: OrderFiles[] = [];
  const createdProofs: Proof[] = [];
  const createdStatusHistory: OrderStatusHistory[] = [];
  const createdEmailNotifications: EmailNotifications[] = [];
  const createdQuotes: Quotes[] = [];
  const createdInvoices: Invoices[] = [];

  try {
    // 1. DELETE ALL EXISTING DATA (in correct order for foreign keys)
    console.log('\n🗑️  Deleting existing data...');
    
    console.log('  - Deleting AuditLog...');
    await prisma.auditLog.deleteMany();
    
    console.log('  - Deleting EmailNotifications...');
    await prisma.emailNotifications.deleteMany();
    
    console.log('  - Deleting OrderStatusHistory...');
    await prisma.orderStatusHistory.deleteMany();
    
    console.log('  - Deleting OrderApprovals...');
    await prisma.orderApprovals.deleteMany();
    
    console.log('  - Deleting Proof...');
    await prisma.proof.deleteMany();
    
    console.log('  - Deleting OrderFiles...');
    await prisma.orderFiles.deleteMany();
    
    console.log('  - Deleting Orders...');
    await prisma.orders.deleteMany();
    
    console.log('  - Deleting Quotes...');
    await prisma.quotes.deleteMany();
    
    console.log('  - Deleting Invoices...');
    await prisma.invoices.deleteMany();
    
    console.log('  - Deleting Session...');
    await prisma.session.deleteMany();
    
    console.log('  - Deleting Account...');
    await prisma.account.deleteMany();
    
    console.log('  - Deleting User...');
    await prisma.user.deleteMany();
    
    console.log('  - Deleting Practice...');
    await prisma.practice.deleteMany();
    
    console.log('  - Deleting WebhookEvent...');
    await prisma.webhookEvent.deleteMany();
    
    console.log('  - Deleting VerificationToken...');
    await prisma.verificationToken.deleteMany();
    
    console.log('✅ All existing data deleted successfully!');

    // 2. CREATE PRACTICES
    console.log('\n🏢 Creating test practices...');
    
    const practices = [
      {
        name: 'Harbor Family Dental',
        address: '123 Harbor Street, Suite 200',
        phone: '(555) 123-4567',
        email: 'info@harborfamilydental.com',
        addressLine1: '123 Harbor Street',
        addressLine2: 'Suite 200',
        city: 'Harbor City',
        state: 'CA',
        zipCode: '90210',
      },
      {
        name: 'Eastside Orthodontics',
        address: '456 East Avenue',
        phone: '(555) 987-6543',
        email: 'contact@eastsideortho.com',
        addressLine1: '456 East Avenue',
        city: 'Eastside',
        state: 'NY',
        zipCode: '10001',
      },
      {
        name: 'Green Valley Pediatrics',
        address: '789 Valley Road, Building A',
        phone: '(555) 456-7890',
        email: 'hello@greenvalleypeds.com',
        addressLine1: '789 Valley Road',
        addressLine2: 'Building A',
        city: 'Green Valley',
        state: 'TX',
        zipCode: '75001',
      },
    ];

    // createdPractices already declared with type annotation above
    for (const practiceData of practices) {
      const practice = await prisma.practice.create({
        data: practiceData,
      });
      createdPractices.push(practice);
      console.log(`  ✅ Created Practice: ${practice.name}`);
    }

    // 3. CREATE USERS
    console.log('\n👥 Creating test users...');
    
    const users = [
      {
        name: 'Super Admin',
        email: 'superadmin@masscomminc.com',
        clerkId: 'user_32VrjrZXuTCOfQjs9BEvkRcYGux',
        role: UserRole.ADMIN,
        practiceId: null, // Super user - no practice assignment
        title: 'System Administrator',
        npi1: '1234567890',
        taxonomyCode: '122300000X',
      },
      {
        name: 'Super Admin PLH',
        email: 'superadmin@patientletterhub.com',
        clerkId: 'user_331Upywb1e4bTSvPTW1ULTPr02J',
        role: UserRole.ADMIN,
        practiceId: null, // Super user - no practice assignment
        title: 'System Administrator',
        npi1: '9876543210',
        taxonomyCode: '122300000X',
      },
      {
        name: 'Admin User One',
        email: 'admin1@test.com',
        role: UserRole.ADMIN,
        practiceId: null, // Super user - no practice assignment
        title: 'System Administrator',
        npi1: '1234567890',
        taxonomyCode: '122300000X',
      },
      {
        name: 'Admin User Two',
        email: 'admin2@test.com',
        role: UserRole.ADMIN,
        practiceId: createdPractices[1].id,
        title: 'Office Manager',
        npi1: '2345678901',
        taxonomyCode: '122300000X',
      },
      {
        name: 'Regular User One',
        email: 'user1@test.com',
        role: UserRole.USER,
        practiceId: createdPractices[0].id,
        title: 'Dental Assistant',
        npi1: '3456789012',
        taxonomyCode: '126800000X',
      },
      {
        name: 'Regular User Two',
        email: 'user2@test.com',
        role: UserRole.USER,
        practiceId: createdPractices[1].id,
        title: 'Orthodontic Assistant',
        npi1: '4567890123',
        taxonomyCode: '126800000X',
      },
      {
        name: 'Regular User Three',
        email: 'user3@test.com',
        role: UserRole.USER,
        practiceId: createdPractices[2].id,
        title: 'Medical Assistant',
        npi1: '5678901234',
        taxonomyCode: '126800000X',
      },
    ];

    // createdUsers already declared with type annotation above
    for (const userData of users) {
      const user = await prisma.user.create({
        data: userData,
      });
      createdUsers.push(user);
      console.log(`  ✅ Created User: ${user.name} (${user.email}) - ${user.role}`);
    }

    // 4. CREATE ORDERS
    console.log('\n📋 Creating test orders...');
    
    const orderStatuses = ['draft', 'pending', 'in_production', 'completed', 'cancelled'];
    const templateTypes = ['postcard', 'letter', 'brochure', 'flyer'];
    const colorModes = ['color', 'black_white', 'grayscale'];
    const subjects = [
      'Appointment Reminder',
      'Treatment Follow-up',
      'Insurance Update',
      'New Patient Welcome',
      'Payment Reminder',
      'Health Screening',
      'Medication Refill',
      'Annual Checkup',
    ];

    // createdOrders already declared with type annotation above
    for (let i = 0; i < 15; i++) {
      const practice = createdPractices[i % createdPractices.length];
      const user = createdUsers[i % createdUsers.length];
      const status = orderStatuses[i % orderStatuses.length];
      
      const order = await prisma.orders.create({
        data: {
          orderNumber: generateOrderNumber(i + 1),
          practiceId: practice.id,
          userId: user.id,
          status: status,
          subject: subjects[i % subjects.length],
          templateType: templateTypes[i % templateTypes.length],
          colorMode: colorModes[i % colorModes.length],
          cost: Math.round((Math.random() * 500 + 100) * 100) / 100, // $100-$600
          actualRecipients: Math.floor(Math.random() * 1000) + 50, // 50-1050 recipients
          costCenter: `CC-${String(i + 1).padStart(3, '0')}`,
          dataCleansing: Math.random() > 0.5,
          firstClassPostage: Math.random() > 0.7,
          ncoaUpdate: Math.random() > 0.6,
          notes: `Test order ${i + 1} - ${status} status`,
          purchaseOrder: `PO-${String(i + 1).padStart(4, '0')}`,
          preferredMailDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000), // Within 30 days
          productionStartDate: status === 'in_production' || status === 'completed' 
            ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) 
            : null,
          productionEndDate: status === 'completed' 
            ? new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000) 
            : null,
          fulfilledAt: status === 'completed' 
            ? new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000) 
            : null,
        },
      });
      createdOrders.push(order);
      console.log(`  ✅ Created Order: ${order.orderNumber} - ${order.status}`);
    }

    // 5. CREATE ORDER FILES
    console.log('\n📁 Creating test order files...');
    
    const fileTypes = ['csv', 'pdf', 'xlsx', 'txt'];
    const fileNames = [
      'patient_list.csv',
      'address_data.xlsx',
      'mailing_template.pdf',
      'custom_content.txt',
      'recipient_data.csv',
    ];

    // createdOrderFiles already declared with type annotation above
    for (let i = 0; i < 20; i++) {
      const order = createdOrders[i % createdOrders.length];
      const user = createdUsers[i % createdUsers.length];
      
      const orderFile = await prisma.orderFiles.create({
        data: {
          orderId: order.id,
          fileName: fileNames[i % fileNames.length],
          fileType: fileTypes[i % fileTypes.length],
          uploadedBy: user.id,
          fileData: generateDummyFileData(),
          fileSize: Math.floor(Math.random() * 1000000) + 10000, // 10KB - 1MB
        },
      });
      createdOrderFiles.push(orderFile);
      console.log(`  ✅ Created OrderFile: ${orderFile.fileName} for Order ${order.orderNumber}`);
    }

    // 6. CREATE PROOFS
    console.log('\n🔍 Creating test proofs...');
    
    const proofStatuses = [ProofStatus.PENDING, ProofStatus.APPROVED, ProofStatus.CHANGES_REQUESTED, ProofStatus.ESCALATED];
    const escalationReasons = [
      'Design changes needed',
      'Content revision required',
      'Address formatting issues',
      'Color correction needed',
      'Layout adjustment required',
    ];

    // createdProofs already declared with type annotation above
    for (let i = 0; i < 10; i++) {
      const order = createdOrders[i % createdOrders.length];
      const user = createdUsers[i % createdUsers.length];
      const status = proofStatuses[i % proofStatuses.length];
      
      const proof = await prisma.proof.create({
        data: {
          orderId: order.id,
          proofRound: Math.floor(i / 3) + 1, // 1-4 rounds
          fileName: `proof_${order.orderNumber}_round_${Math.floor(i / 3) + 1}.pdf`,
          fileType: 'pdf',
          fileData: generateDummyFileData(),
          fileSize: Math.floor(Math.random() * 500000) + 50000, // 50KB - 550KB
          status: status,
          userFeedback: status === ProofStatus.CHANGES_REQUESTED 
            ? `Please revise the ${escalationReasons[i % escalationReasons.length]}` 
            : null,
          adminNotes: status === ProofStatus.ESCALATED 
            ? `Escalated due to: ${escalationReasons[i % escalationReasons.length]}` 
            : null,
          uploadedBy: user.id,
          respondedAt: status === ProofStatus.APPROVED 
            ? new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000) 
            : null,
          escalationReason: status === ProofStatus.ESCALATED 
            ? escalationReasons[i % escalationReasons.length] 
            : null,
        },
      });
      createdProofs.push(proof);
      console.log(`  ✅ Created Proof: ${proof.fileName} - ${proof.status}`);
    }

    // 7. CREATE ORDER STATUS HISTORY
    console.log('\n📊 Creating test order status history...');
    
    const statusTransitions = [
      { from: 'draft', to: 'pending' },
      { from: 'pending', to: 'in_production' },
      { from: 'in_production', to: 'completed' },
      { from: 'pending', to: 'cancelled' },
      { from: 'draft', to: 'cancelled' },
    ];

    // createdStatusHistory already declared with type annotation above
    for (let i = 0; i < 25; i++) {
      const order = createdOrders[i % createdOrders.length];
      const user = createdUsers[i % createdUsers.length];
      const transition = statusTransitions[i % statusTransitions.length];
      
      const statusHistory = await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: transition.from,
          toStatus: transition.to,
          changedBy: user.id,
          changedByRole: user.role,
          comments: `Status changed from ${transition.from} to ${transition.to}`,
          metadata: {
            reason: 'Automated status update',
            timestamp: new Date().toISOString(),
            orderNumber: order.orderNumber,
          },
        },
      });
      createdStatusHistory.push(statusHistory);
      console.log(`  ✅ Created StatusHistory: ${transition.from} → ${transition.to} for Order ${order.orderNumber}`);
    }

    // 8. CREATE EMAIL NOTIFICATIONS
    console.log('\n📧 Creating test email notifications...');
    
    const emailTypes = ['order_created', 'status_update', 'proof_ready', 'order_completed', 'payment_reminder'];
    const emailSubjects = [
      'New Order Created',
      'Order Status Update',
      'Proof Ready for Review',
      'Order Completed',
      'Payment Reminder',
    ];

    // createdEmailNotifications already declared with type annotation above
    for (let i = 0; i < 15; i++) {
      const order = createdOrders[i % createdOrders.length];
      const user = createdUsers[i % createdUsers.length];
      const practice = createdPractices[i % createdPractices.length];
      
      const emailNotification = await prisma.emailNotifications.create({
        data: {
          orderId: order.id,
          userId: user.id,
          practiceId: practice.id,
          recipientEmail: user.email!,
          emailType: emailTypes[i % emailTypes.length],
          subject: emailSubjects[i % emailSubjects.length],
          content: `This is a test email notification for ${order.orderNumber}. Status: ${order.status}`,
          status: Math.random() > 0.1 ? 'sent' : 'failed', // 90% success rate
          errorMessage: Math.random() > 0.9 ? 'SMTP connection timeout' : null,
          metadata: JSON.stringify({
            orderNumber: order.orderNumber,
            practiceName: practice.name,
            timestamp: new Date().toISOString(),
          }),
        },
      });
      createdEmailNotifications.push(emailNotification);
      console.log(`  ✅ Created EmailNotification: ${emailNotification.subject} - ${emailNotification.status}`);
    }

    // 9. CREATE QUOTES
    console.log('\n💰 Creating test quotes...');
    
    const quoteStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
    
    // createdQuotes already declared with type annotation above
    for (let i = 0; i < 5; i++) {
      const practice = createdPractices[i % createdPractices.length];
      const user = createdUsers[i % createdUsers.length];
      
      const quote = await prisma.quotes.create({
        data: {
          practiceId: practice.id,
          userId: user.id,
          quoteNumber: generateQuoteNumber(i + 1),
          status: quoteStatuses[i % quoteStatuses.length],
          totalCost: Math.round((Math.random() * 1000 + 200) * 100) / 100, // $200-$1200
          colorMode: colorModes[i % colorModes.length],
          costCenter: `CC-QUOTE-${String(i + 1).padStart(3, '0')}`,
          dataCleansing: Math.random() > 0.5,
          estimatedRecipients: Math.floor(Math.random() * 2000) + 100, // 100-2100 recipients
          firstClassPostage: Math.random() > 0.7,
          ncoaUpdate: Math.random() > 0.6,
          notes: `Test quote ${i + 1} for ${practice.name}`,
          purchaseOrder: `PO-QUOTE-${String(i + 1).padStart(4, '0')}`,
          subject: subjects[i % subjects.length],
        },
      });
      createdQuotes.push(quote);
      console.log(`  ✅ Created Quote: ${quote.quoteNumber} - ${quote.status}`);
    }

    // 10. CREATE INVOICES
    console.log('\n🧾 Creating test invoices...');
    
    // createdInvoices already declared with type annotation above
    for (let i = 0; i < 5; i++) {
      const order = createdOrders[i % createdOrders.length];
      const user = createdUsers[i % createdUsers.length];
      const practice = createdPractices[i % createdPractices.length];
      
      const subtotal = Math.round((Math.random() * 500 + 100) * 100) / 100;
      const taxAmount = Math.round(subtotal * 0.08 * 100) / 100; // 8% tax
      const totalAmount = subtotal + taxAmount;
      
      const invoice = await prisma.invoices.create({
        data: {
          invoiceNumber: generateInvoiceNumber(i + 1),
          orderId: order.id,
          userId: user.id,
          practiceId: practice.id,
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
          subtotal: subtotal.toFixed(2),
          taxAmount: taxAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          status: Math.random() > 0.3 ? 'paid' : 'pending',
          paymentTerms: 'Net 30',
          notes: `Invoice for order ${order.orderNumber}`,
          pdfPath: `/invoices/invoice_${generateInvoiceNumber(i + 1)}.pdf`,
        },
      });
      createdInvoices.push(invoice);
      console.log(`  ✅ Created Invoice: ${invoice.invoiceNumber} - $${invoice.totalAmount}`);
    }

    // 11. CREATE AUDIT LOGS
    console.log('\n📝 Creating test audit logs...');
    
    const auditActions = [AuditAction.CREATE, AuditAction.UPDATE, AuditAction.READ, AuditAction.DELETE, AuditAction.LOGIN];
    const auditResources = [AuditResource.ORDER, AuditResource.USER, AuditResource.PRACTICE, AuditResource.PROOF, AuditResource.EMAIL];
    const auditSeverities = [AuditSeverity.LOW, AuditSeverity.MEDIUM, AuditSeverity.HIGH];
    
    for (let i = 0; i < 20; i++) {
      const user = createdUsers[i % createdUsers.length];
      const practice = createdPractices[i % createdPractices.length];
      const order = createdOrders[i % createdOrders.length];
      
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userEmail: user.email!,
          userRole: user.role,
          userName: user.name!,
          action: auditActions[i % auditActions.length],
          resource: auditResources[i % auditResources.length],
          resourceId: order.id,
          description: `Test audit log entry ${i + 1}`,
          practiceId: practice.id,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          method: 'POST',
          path: '/api/orders',
          statusCode: 200,
          containsPatientData: Math.random() > 0.7,
          containsPHI: Math.random() > 0.8,
          severity: auditSeverities[i % auditSeverities.length],
          success: Math.random() > 0.1,
          errorMessage: Math.random() > 0.9 ? 'Test error message' : null,
          retainUntil: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000), // 7 years
        },
      });
    }
    console.log('  ✅ Created 20 audit log entries');

    // 12. SUMMARY REPORT
    console.log('\n📊 SEED SUMMARY REPORT:');
    console.log('=====================================');
    console.log(`🏢 Practices: ${createdPractices.length}`);
    console.log(`👥 Users: ${createdUsers.length} (${createdUsers.filter(u => u.role === UserRole.ADMIN).length} ADMIN, ${createdUsers.filter(u => u.role === UserRole.USER).length} USER)`);
    console.log(`📋 Orders: ${createdOrders.length}`);
    console.log(`📁 Order Files: ${createdOrderFiles.length}`);
    console.log(`🔍 Proofs: ${createdProofs.length}`);
    console.log(`📊 Status History: ${createdStatusHistory.length}`);
    console.log(`📧 Email Notifications: ${createdEmailNotifications.length}`);
    console.log(`💰 Quotes: ${createdQuotes.length}`);
    console.log(`🧾 Invoices: ${createdInvoices.length}`);
    console.log(`📝 Audit Logs: 20`);
    
    console.log('\n🏢 PRACTICE BREAKDOWN:');
    for (const practice of createdPractices) {
      const practiceUsers = createdUsers.filter(u => u.practiceId === practice.id);
      const practiceOrders = createdOrders.filter(o => o.practiceId === practice.id);
      console.log(`\n${practice.name}:`);
      console.log(`  👥 Users: ${practiceUsers.length}`);
      console.log(`  📋 Orders: ${practiceOrders.length}`);
      practiceUsers.forEach(user => {
        console.log(`    - ${user.name} (${user.email}) [${user.role}]`);
      });
    }

    console.log('\n✅ Comprehensive development seed completed successfully!');
    console.log('🎯 Database is now ready for development and testing');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
