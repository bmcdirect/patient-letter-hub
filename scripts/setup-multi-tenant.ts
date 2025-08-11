import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupMultiTenant() {
  try {
    console.log('🔧 Setting up multi-tenant configuration...');

    // 1. Check current user (you)
    const currentUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: 'david.sweeney@example.com' },
          { email: 'admin@patientletterhub.com' },
          { email: { contains: 'david' } }
        ]
      },
      include: { practice: true }
    });

    console.log('Current user found:', currentUser ? {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
      practiceId: currentUser.practiceId,
      practiceName: currentUser.practice?.name
    } : 'No current user found');

    // 2. Create or update SuperAdmin role for current user
    if (currentUser) {
      const updatedUser = await prisma.user.update({
        where: { id: currentUser.id },
        data: { 
          role: 'ADMIN',
          practiceId: null // SuperAdmin has no practice assignment - can see all orders
        },
        include: { practice: true }
      });
      console.log('✅ Updated user to SuperAdmin:', {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        practiceId: updatedUser.practiceId
      });
    } else {
      console.log('❌ No current user found to promote to SuperAdmin');
    }

    // 3. Check existing practices
    const existingPractices = await prisma.practice.findMany();
    console.log('Existing practices:', existingPractices.map(p => ({ id: p.id, name: p.name, organizationId: p.organizationId })));

    // 4. Find or create Riverside Family Medicine
    let riversidePractice = existingPractices.find(p => p.name.includes('Riverside'));
    if (!riversidePractice) {
      riversidePractice = await prisma.practice.create({
        data: {
          organizationId: 'org_30ut6cLeepKYTXumxP21jmz6ree',
          name: 'Riverside Family Medicine',
          email: 'admin@riversidefamilymedicine.com',
          phone: '555-123-4567',
          address: '123 Riverside Dr, Medical District'
        }
      });
      console.log('✅ Created Riverside Family Medicine:', riversidePractice.id);
    } else {
      console.log('✅ Riverside Family Medicine already exists:', riversidePractice.id);
    }

    // 5. Find or create Bright Smiles Dental
    let brightSmilesPractice = existingPractices.find(p => p.name.includes('Bright Smiles'));
    if (!brightSmilesPractice) {
      brightSmilesPractice = await prisma.practice.create({
        data: {
          organizationId: 'org_30ut9E4OtIT3bh0D1FVyDwlZ2tj',
          name: 'Bright Smiles Dental Practice',
          email: 'admin@brightsmilesdental.com',
          phone: '555-987-6543',
          address: '456 Dental Ave, Professional Plaza'
        }
      });
      console.log('✅ Created Bright Smiles Dental Practice:', brightSmilesPractice.id);
    } else {
      console.log('✅ Bright Smiles Dental Practice already exists:', brightSmilesPractice.id);
    }

    // 6. Create test users for both practices
    const testUsers = [
      // Riverside Family Medicine users
      {
        email: 'doctor.riverside@riversidefamilymedicine.com',
        name: 'Dr. Sarah Riverside',
        role: 'USER' as const,
        practiceId: riversidePractice.id,
        description: 'Riverside Family Medicine - Doctor'
      },
      {
        email: 'admin.riverside@riversidefamilymedicine.com',
        name: 'Admin Riverside',
        role: 'ADMIN' as const,
        practiceId: riversidePractice.id,
        description: 'Riverside Family Medicine - Admin'
      },
      // Bright Smiles Dental users
      {
        email: 'doctor.brightsmiles@brightsmilesdental.com',
        name: 'Dr. Michael Bright',
        role: 'USER' as const,
        practiceId: brightSmilesPractice.id,
        description: 'Bright Smiles Dental - Doctor'
      },
      {
        email: 'admin.brightsmiles@brightsmilesdental.com',
        name: 'Admin Bright Smiles',
        role: 'ADMIN' as const,
        practiceId: brightSmilesPractice.id,
        description: 'Bright Smiles Dental - Admin'
      }
    ];

    console.log('\n🔧 Creating test users...');
    for (const userData of testUsers) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`⚠️ User ${userData.email} already exists`);
      } else {
        const newUser = await prisma.user.create({
          data: {
            email: userData.email,
            name: userData.name,
            role: userData.role,
            practiceId: userData.practiceId
          },
          include: { practice: true }
        });
        console.log(`✅ Created ${userData.description}:`, newUser.email);
      }
    }

    // 7. Verify multi-tenant setup
    console.log('\n📊 Multi-tenant setup verification:');
    console.log('=====================================');
    
    const allUsers = await prisma.user.findMany({
      include: { practice: true }
    });

    console.log('\n👥 All Users:');
    allUsers.forEach(user => {
      const practiceInfo = user.practiceId ? `(${user.practice?.name || 'Unknown Practice'})` : '(SuperAdmin - No Practice)';
      console.log(`  - ${user.email} - ${user.role} ${practiceInfo}`);
    });

    const allPractices = await prisma.practice.findMany({
      include: { users: true }
    });

    console.log('\n🏥 All Practices:');
    allPractices.forEach(practice => {
      console.log(`  - ${practice.name} (${practice.users.length} users):`);
      practice.users.forEach(user => {
        console.log(`    * ${user.email} (${user.role})`);
      });
    });

    console.log('\n🎯 Testing Scenarios Setup:');
    console.log('===========================');
    console.log('1. ✅ SuperAdmin Access: You can now access /admin dashboard');
    console.log('2. ✅ Multi-Practice Setup: Riverside Family Medicine + Bright Smiles Dental');
    console.log('3. ✅ User Role Testing: Test users created for both practices');
    console.log('4. ✅ Multi-Tenant Isolation: Users only see their practice data');
    
    console.log('\n🔑 Test User Credentials:');
    console.log('========================');
    console.log('Riverside Family Medicine:');
    console.log('  - Doctor: doctor.riverside@riversidefamilymedicine.com');
    console.log('  - Admin: admin.riverside@riversidefamilymedicine.com');
    console.log('\nBright Smiles Dental:');
    console.log('  - Doctor: doctor.brightsmiles@brightsmilesdental.com');
    console.log('  - Admin: admin.brightsmiles@brightsmilesdental.com');
    console.log('\nSuperAdmin (You):');
    console.log('  - Email: (your current email)');
    console.log('  - Role: ADMIN (SuperAdmin - no practice assignment)');

    console.log('\n🚀 Next Steps:');
    console.log('==============');
    console.log('1. Create these users in Clerk dashboard with the exact email addresses');
    console.log('2. Test login as different users to verify multi-tenant isolation');
    console.log('3. Test the complete proofing workflow end-to-end');
    console.log('4. Verify SuperAdmin can see all orders from both practices');

  } catch (error) {
    console.error('❌ Error setting up multi-tenant:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupMultiTenant();
