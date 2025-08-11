import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCurrentUsers() {
  try {
    console.log('🔍 Checking current users...');
    
    const users = await prisma.user.findMany({
      include: { practice: true }
    });
    
    console.log('\n📊 Current Users:');
    console.log('================');
    
    users.forEach(user => {
      const practiceInfo = user.practiceId ? `(${user.practice?.name || 'Unknown Practice'})` : '(SuperAdmin - No Practice)';
      console.log(`- ${user.email} - ${user.role} ${practiceInfo}`);
    });
    
    console.log(`\n📈 Total Users: ${users.length}`);
    
    const superAdmins = users.filter(u => u.role === 'ADMIN' && !u.practiceId);
    const practiceAdmins = users.filter(u => u.role === 'ADMIN' && u.practiceId);
    const practiceUsers = users.filter(u => u.role === 'USER' && u.practiceId);
    
    console.log(`\n👥 User Breakdown:`);
    console.log(`- SuperAdmins: ${superAdmins.length}`);
    console.log(`- Practice Admins: ${practiceAdmins.length}`);
    console.log(`- Practice Users: ${practiceUsers.length}`);
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentUsers();
