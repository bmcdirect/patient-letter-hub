import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function promoteUserToAdmin(email: string) {
  try {
    console.log(`🔍 Promoting user ${email} to admin...`);
    
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log(`❌ User ${email} not found`);
      return;
    }

    console.log(`✅ Found user: ${user.email} (current role: ${user.role})`);

    if (user.role === 'ADMIN') {
      console.log(`ℹ️ User ${email} is already an admin`);
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    });

    console.log(`✅ Successfully promoted ${updatedUser.email} to ADMIN role`);

  } catch (error) {
    console.error('❌ Error promoting user to admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Promote daves@masscomminc.com to admin
promoteUserToAdmin('daves@masscomminc.com');
