import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserRoles() {
  try {
    console.log('🔍 Checking user roles in database...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        clerkId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - Clerk ID: ${user.clerkId || 'None'}`);
    });

    const adminUsers = users.filter(u => u.role === 'ADMIN');
    console.log(`\n🔍 Admin users: ${adminUsers.length}`);
    adminUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });

    const regularUsers = users.filter(u => u.role === 'USER');
    console.log(`\n🔍 Regular users: ${regularUsers.length}`);
    regularUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });

  } catch (error) {
    console.error('❌ Error checking user roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRoles();
