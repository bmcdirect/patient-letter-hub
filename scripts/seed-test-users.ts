import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting test data seeding...');

  // Clear existing test data (but preserve orders/quotes)
  console.log('🧹 Clearing existing test users and practices...');
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          'admin@test.com',
          'admin1@practice1.com',
          'user1@practice1.com',
          'admin2@practice2.com',
          'user2@practice2.com'
        ]
      }
    }
  });

  await prisma.practice.deleteMany({
    where: {
      name: {
        in: [
          'Test Practice 1',
          'Test Practice 2'
        ]
      }
    }
  });

  // Create Test Practice 1
  console.log('🏥 Creating Test Practice 1...');
  const practice1 = await prisma.practice.create({
    data: {
      name: 'Test Practice 1',
      address: '123 Healthcare Ave, Medical City, MC 12345',
      phone: '(555) 123-4567',
      email: 'info@practice1.com'
    }
  });

  // Create Test Practice 2
  console.log('🏥 Creating Test Practice 2...');
  const practice2 = await prisma.practice.create({
    data: {
      name: 'Test Practice 2',
      address: '456 Wellness Blvd, Health Town, HT 67890',
      phone: '(555) 987-6543',
      email: 'info@practice2.com'
    }
  });

  // Create Super Admin User (no practice - can access all)
  console.log('👑 Creating Super Admin...');
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@test.com',
      role: UserRole.ADMIN,
      practiceId: practice1.id, // Temporary assignment, will be handled in auth logic
    }
  });

  // Create Practice 1 Admin
  console.log('👨‍⚕️ Creating Practice 1 Admin...');
  const practice1Admin = await prisma.user.create({
    data: {
      name: 'Dr. Smith (Admin)',
      email: 'admin1@practice1.com',
      role: UserRole.ADMIN,
      practiceId: practice1.id,
    }
  });

  // Create Practice 1 User
  console.log('👩‍⚕️ Creating Practice 1 User...');
  const practice1User = await prisma.user.create({
    data: {
      name: 'Nurse Johnson',
      email: 'user1@practice1.com',
      role: UserRole.USER,
      practiceId: practice1.id,
    }
  });

  // Create Practice 2 Admin
  console.log('👨‍⚕️ Creating Practice 2 Admin...');
  const practice2Admin = await prisma.user.create({
    data: {
      name: 'Dr. Jones (Admin)',
      email: 'admin2@practice2.com',
      role: UserRole.ADMIN,
      practiceId: practice2.id,
    }
  });

  // Create Practice 2 User
  console.log('👩‍⚕️ Creating Practice 2 User...');
  const practice2User = await prisma.user.create({
    data: {
      name: 'Nurse Williams',
      email: 'user2@practice2.com',
      role: UserRole.USER,
      practiceId: practice2.id,
    }
  });

  console.log('✅ Test data seeding completed!');
  console.log('\n📋 Test Users Created:');
  console.log('┌─────────────────────┬─────────────────────┬─────────┬─────────────┐');
  console.log('│ Email               │ Name                │ Role    │ Practice    │');
  console.log('├─────────────────────┼─────────────────────┼─────────┼─────────────┤');
  console.log(`│ admin@test.com      │ Super Admin         │ ADMIN   │ All         │`);
  console.log(`│ admin1@practice1.com│ Dr. Smith (Admin)   │ ADMIN   │ Practice 1  │`);
  console.log(`│ user1@practice1.com │ Nurse Johnson       │ USER    │ Practice 1  │`);
  console.log(`│ admin2@practice2.com│ Dr. Jones (Admin)   │ ADMIN   │ Practice 2  │`);
  console.log(`│ user2@practice2.com │ Nurse Williams      │ USER    │ Practice 2  │`);
  console.log('└─────────────────────┴─────────────────────┴─────────┴─────────────┘');
  console.log('\n🔑 Password for all users: password123');
  console.log('\n🧪 Testing Scenarios:');
  console.log('• Login as admin@test.com → Super admin with access to all practices');
  console.log('• Login as admin1@practice1.com → Practice 1 admin');
  console.log('• Login as user1@practice1.com → Practice 1 regular user');
  console.log('• Login as admin2@practice2.com → Practice 2 admin');
  console.log('• Login as user2@practice2.com → Practice 2 regular user');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 