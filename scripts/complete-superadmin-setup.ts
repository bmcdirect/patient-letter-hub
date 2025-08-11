import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function completeSuperAdminSetup() {
  try {
    console.log('🔧 Completing SuperAdmin setup...');

    // Find the current user
    const currentUser = await prisma.user.findUnique({
      where: { email: 'daves@masscomminc.com' },
      include: { practice: true }
    });

    if (!currentUser) {
      console.log('❌ Current user not found');
      return;
    }

    console.log('Current user:', {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
      practiceId: currentUser.practiceId,
      practiceName: currentUser.practice?.name
    });

    // Update to SuperAdmin (ADMIN role with no practice assignment)
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: { 
        role: 'ADMIN',
        practiceId: null // SuperAdmin has no practice assignment - can see all orders
      },
      include: { practice: true }
    });

    console.log('✅ Successfully promoted to SuperAdmin:', {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      practiceId: updatedUser.practiceId,
      practiceName: updatedUser.practice?.name
    });

    // Verify the setup
    console.log('\n📊 Current setup verification:');
    console.log('=============================');
    
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

    console.log('\n🎯 SuperAdmin Access Confirmed:');
    console.log('===============================');
    console.log('✅ You can now access /admin dashboard as SuperAdmin');
    console.log('✅ You can see all orders from all practices');
    console.log('✅ You can process orders for any practice');
    console.log('✅ You can upload proofs and manage status for any order');

    console.log('\n🔑 Test User Credentials for Multi-Tenant Testing:');
    console.log('==================================================');
    console.log('Riverside Family Medicine:');
    console.log('  - Doctor: doctor.riverside@riversidefamilymedicine.com');
    console.log('  - Admin: admin.riverside@riversidefamilymedicine.com');
    console.log('\nBright Smiles Dental:');
    console.log('  - Doctor: doctor.brightsmiles@brightsmilesdental.com');
    console.log('  - Admin: admin.brightsmiles@brightsmilesdental.com');

    console.log('\n🚀 Next Steps for Complete Testing:');
    console.log('====================================');
    console.log('1. Create the test users in Clerk dashboard with exact email addresses');
    console.log('2. Test login as different users to verify multi-tenant isolation');
    console.log('3. Test the complete proofing workflow end-to-end');
    console.log('4. Verify SuperAdmin can see all orders from both practices');

  } catch (error) {
    console.error('❌ Error completing SuperAdmin setup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeSuperAdminSetup();
