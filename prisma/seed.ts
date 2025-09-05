import { PrismaClient, UserRole } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed process...');

  // 1. CREATE SUPERADMIN USER (no practice association)
  console.log('👑 Creating SuperAdmin user...');
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@masscomminc.com',
      role: UserRole.ADMIN,
      practiceId: null, // No practice - SuperAdmin access
      clerkId: 'user_314b0h210YO1X1IwZjrnigzSFa9', // Consistent with backup
    },
  });
  console.log(`✅ Created SuperAdmin: ${superAdmin.email}`);

  // 2. CREATE TENANT ORGANIZATIONS (Practices)
  console.log('🏢 Creating tenant organizations...');
  const practice1 = await prisma.practice.create({
    data: {
      name: 'Downtown Medical Group',
      address: '123 Main St, Cityville',
      phone: '555-123-4567',
      email: 'contact@downtownmed.com',
      addressLine1: '123 Main St',
      city: 'Cityville',
      state: 'CA',
      zipCode: '90210',
    },
  });
  const practice2 = await prisma.practice.create({
    data: {
      name: 'Lakeside Family Health',
      address: '456 Lake Ave, Townsville',
      phone: '555-987-6543',
      email: 'info@lakesidehealth.com',
      addressLine1: '456 Lake Ave',
      city: 'Townsville',
      state: 'NY',
      zipCode: '10001',
    },
  });
  console.log(`✅ Created practices: ${practice1.name}, ${practice2.name}`);

  // 3. CREATE TENANT USERS (with proper practice associations)
  console.log('👥 Creating tenant users...');
  const tenantUsers = [
    {
      name: 'Dr. Alice Smith',
      email: 'alice@downtownmed.com',
      role: UserRole.USER,
      practiceId: practice1.id,
    },
    {
      name: 'Dr. Bob Jones',
      email: 'bob@downtownmed.com',
      role: UserRole.ADMIN,
      practiceId: practice1.id,
    },
    {
      name: 'Dr. Carol Lee',
      email: 'carol@lakesidehealth.com',
      role: UserRole.USER,
      practiceId: practice2.id,
    },
    {
      name: 'Dr. Dan Miller',
      email: 'dan@lakesidehealth.com',
      role: UserRole.ADMIN,
      practiceId: practice2.id,
    },
  ];

  const createdUsers: any[] = [];
  for (const userData of tenantUsers) {
    const user = await prisma.user.create({
      data: userData,
    });
    createdUsers.push(user);
    console.log(`✅ Created user: ${user.name} (${user.email}) - Practice: ${userData.practiceId === practice1.id ? practice1.name : practice2.name}`);
  }

  // 4. CREATE TENANT-SPECIFIC BUSINESS DATA (proper tenant isolation)
  console.log('📊 Creating tenant-specific business data...');
  
  for (const user of createdUsers) {
    // Only create business data for tenant users (those with practiceId)
    if (user.practiceId) {
      const practice = user.practiceId === practice1.id ? practice1 : practice2;
      
      // Create quote for this tenant
      const quote = await prisma.quotes.create({
        data: {
          practiceId: user.practiceId,
          userId: user.id,
          quoteNumber: `Q-${practice.name.replace(/\s+/g, '').toUpperCase()}-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          status: 'pending',
          totalCost: 250.00,
          subject: `${practice.name} - Annual Checkup Reminder`,
          estimatedRecipients: 100,
          colorMode: 'color',
          dataCleansing: true,
          ncoaUpdate: false,
          firstClassPostage: true,
          notes: `Include new office hours for ${practice.name}.`,
        },
      });
      
      // Create order for this tenant
      const order = await prisma.orders.create({
        data: {
          orderNumber: `O-${practice.name.replace(/\s+/g, '').toUpperCase()}-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          practiceId: user.practiceId,
          userId: user.id,
          status: 'created',
          subject: `${practice.name} - Annual Checkup Reminder`,
          templateType: 'Letter',
          colorMode: 'color',
          cost: 250.00,
        },
      });
      
      console.log(`✅ Created business data for ${practice.name}: Quote ${quote.quoteNumber}, Order ${order.orderNumber}`);
    }
  }

  // 5. VERIFY TENANT ISOLATION
  console.log('🔍 Verifying tenant isolation...');
  const allUsers = await prisma.user.findMany({
    include: { practice: true },
  });
  
  const allQuotes = await prisma.quotes.findMany({
    include: { practice: true, user: true },
  });
  
  const allOrders = await prisma.orders.findMany({
    include: { practice: true, user: true },
  });

  console.log('\n📋 SEED SUMMARY:');
  console.log(`👑 SuperAdmin users: ${allUsers.filter(u => !u.practiceId).length}`);
  console.log(`👥 Tenant users: ${allUsers.filter(u => u.practiceId).length}`);
  console.log(`🏢 Practices: ${await prisma.practice.count()}`);
  console.log(`📝 Quotes: ${allQuotes.length}`);
  console.log(`📦 Orders: ${allOrders.length}`);
  
  console.log('\n🏢 TENANT BREAKDOWN:');
  const practices = await prisma.practice.findMany({
    include: {
      users: true,
      quotes: true,
      orders: true,
    },
  });
  
  for (const practice of practices) {
    console.log(`\n${practice.name}:`);
    console.log(`  👥 Users: ${practice.users.length}`);
    console.log(`  📝 Quotes: ${practice.quotes.length}`);
    console.log(`  📦 Orders: ${practice.orders.length}`);
  }

  console.log('\n✅ Seed data created successfully with proper multi-tenancy!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 