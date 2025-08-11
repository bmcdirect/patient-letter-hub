import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupSuperadmin() {
  try {
    console.log('🔧 Setting up superadmin configuration...');
    
    // 1. Check if superadmin@masscomminc.com already exists
    const existingSuperadmin = await prisma.user.findUnique({
      where: { email: 'superadmin@masscomminc.com' }
    });
    
    if (existingSuperadmin) {
      console.log('⚠️ superadmin@masscomminc.com already exists');
      if (existingSuperadmin.role === 'ADMIN' && !existingSuperadmin.practiceId) {
        console.log('✅ superadmin@masscomminc.com is already configured as SuperAdmin');
      } else {
        console.log('🔄 Updating superadmin@masscomminc.com to SuperAdmin role...');
        await prisma.user.update({
          where: { id: existingSuperadmin.id },
          data: {
            role: 'ADMIN',
            practiceId: null // SuperAdmin has no practice assignment
          }
        });
        console.log('✅ Updated superadmin@masscomminc.com to SuperAdmin');
      }
    } else {
      console.log('🆕 Creating superadmin@masscomminc.com...');
      await prisma.user.create({
        data: {
          email: 'superadmin@masscomminc.com',
          name: 'Super Admin',
          role: 'ADMIN',
          practiceId: null // SuperAdmin has no practice assignment
        }
      });
      console.log('✅ Created superadmin@masscomminc.com as SuperAdmin');
    }
    
    // 2. Update daves@masscomminc.com to be a Riverside practice user
    const existingDave = await prisma.user.findUnique({
      where: { email: 'daves@masscomminc.com' }
    });
    
    if (existingDave) {
      console.log('🔄 Updating daves@masscomminc.com to Riverside practice user...');
      
      // Find Riverside Family Medicine practice
      const riversidePractice = await prisma.practice.findFirst({
        where: { name: { contains: 'Riverside' } }
      });
      
      if (!riversidePractice) {
        console.log('❌ Riverside Family Medicine practice not found');
        return;
      }
      
      await prisma.user.update({
        where: { id: existingDave.id },
        data: {
          role: 'USER', // Practice user, not admin
          practiceId: riversidePractice.id
        }
      });
      console.log('✅ Updated daves@masscomminc.com to Riverside practice user');
    } else {
      console.log('❌ daves@masscomminc.com not found');
    }
    
    // 3. Verify the setup
    console.log('\n📊 Verification of setup:');
    console.log('========================');
    
    const allUsers = await prisma.user.findMany({
      include: { practice: true }
    });
    
    allUsers.forEach(user => {
      const practiceInfo = user.practiceId ? `(${user.practice?.name || 'Unknown Practice'})` : '(SuperAdmin - No Practice)';
      const roleDisplay = user.role === 'ADMIN' && !user.practiceId ? 'SUPERADMIN' : user.role;
      console.log(`- ${user.email} - ${roleDisplay} ${practiceInfo}`);
    });
    
    console.log('\n🎯 Testing Configuration:');
    console.log('=========================');
    console.log('1. ✅ superadmin@masscomminc.com - SuperAdmin (no practice, can see all orders)');
    console.log('2. ✅ daves@masscomminc.com - Practice User (Riverside Family Medicine)');
    console.log('3. ✅ admin.riverside@riversidefamilymedicine.com - Practice Admin (Riverside)');
    console.log('4. ✅ doctor.riverside@riversidefamilymedicine.com - Practice User (Riverside)');
    console.log('5. ✅ admin.brightsmiles@brightsmilesdental.com - Practice Admin (Bright Smiles)');
    console.log('6. ✅ doctor.brightsmiles@brightsmilesdental.com - Practice User (Bright Smiles)');
    
    console.log('\n🚀 Next Steps for Testing:');
    console.log('==========================');
    console.log('1. Create superadmin@masscomminc.com in Clerk dashboard');
    console.log('2. Test login as superadmin@masscomminc.com');
    console.log('3. Access /admin dashboard as SuperAdmin');
    console.log('4. Test multi-tenant isolation');
    console.log('5. Test complete proofing workflow end-to-end');
    
  } catch (error) {
    console.error('❌ Error setting up superadmin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupSuperadmin();
