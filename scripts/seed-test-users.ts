import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Clearing existing test data...');
  
  // Clear existing test users and practices
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          'admin@yourdomain.com',
          'admin1@yourdomain.com',
          'user1@yourdomain.com',
          'admin2@yourdomain.com',
          'user2@yourdomain.com'
        ]
      }
    }
  });

  await prisma.practice.deleteMany({
    where: {
      name: {
        in: ['Test Practice 1', 'Test Practice 2']
      }
    }
  });

  console.log('✅ Test data cleared');

  // Create test practices
  const practice1 = await prisma.practice.create({
    data: {
      name: 'Test Practice 1',
      address: '123 Test Street, Test City, TC 12345',
      phone: '(555) 123-4567',
      email: 'practice1@test.com'
    }
  });

  const practice2 = await prisma.practice.create({
    data: {
      name: 'Test Practice 2',
      address: '456 Test Avenue, Test Town, TT 67890',
      phone: '(555) 987-6543',
      email: 'practice2@test.com'
    }
  });

  console.log('✅ Test practices created');

  // Create test users with real email addresses
  const users = [
    {
      email: 'admin@yourdomain.com', // Replace with your actual email
      name: 'Super Admin',
      role: 'ADMIN' as const,
      practiceId: undefined, // Super Admin has no practice assignment - can see all orders
    },
    {
      email: 'admin1@yourdomain.com', // Replace with your actual email
      name: 'Practice 1 Admin',
      role: 'ADMIN' as const,
      practiceId: practice1.id,
    },
    {
      email: 'user1@yourdomain.com', // Replace with your actual email
      name: 'Practice 1 User',
      role: 'USER' as const,
      practiceId: practice1.id,
    },
    {
      email: 'admin2@yourdomain.com', // Replace with your actual email
      name: 'Practice 2 Admin',
      role: 'ADMIN' as const,
      practiceId: practice2.id,
    },
    {
      email: 'user2@yourdomain.com', // Replace with your actual email
      name: 'Practice 2 User',
      role: 'USER' as const,
      practiceId: practice2.id,
    }
  ];

  for (const userData of users) {
    const userCreateData: any = {
      email: userData.email,
      name: userData.name,
      role: userData.role,
    };
    
    if (userData.practiceId) {
      userCreateData.practiceId = userData.practiceId;
    }
    
    await prisma.user.create({
      data: userCreateData
    });
  }

  console.log('✅ Test users created');
  console.log('\n📋 Test User Credentials:');
  console.log('========================');
  
  users.forEach(user => {
    console.log(`Email: ${user.email}`);
    console.log(`Password: Create in Clerk dashboard or use secure password`);
    console.log(`Role: ${user.role}`);
    if (user.practiceId === null) {
      console.log(`Practice: Super Admin (No Practice - Can See All Orders)`);
    } else {
      console.log(`Practice: ${user.practiceId === practice1.id ? 'Practice 1' : 'Practice 2'}`);
    }
    console.log('---');
  });

  console.log('\n🎯 Testing Scenarios:');
  console.log('===================');
  console.log('1. Super Admin (admin@yourdomain.com) - No practice, can see ALL orders from all practices');
  console.log('2. Practice-specific admins - Can approve orders for their practice only');
  console.log('3. Practice-specific users - Can create orders but not approve');
  console.log('4. Multi-tenant isolation - Practice users only see their practice data');
  console.log('\n📝 Note: Passwords are managed by Clerk, not stored in database');
  console.log('   Create users in Clerk dashboard or use secure passwords during sign-up');
  console.log('\n🔒 Super Admin Security:');
  console.log('   - Super Admin should only be created via back-office tools');
  console.log('   - Cannot be created via normal Clerk sign-up process');
  console.log('\n📧 Email Setup:');
  console.log('   - Replace @yourdomain.com with your actual email domain');
  console.log('   - Create users in Clerk dashboard with these exact email addresses');
  console.log('   - Passwords are managed by Clerk, not stored in database');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 