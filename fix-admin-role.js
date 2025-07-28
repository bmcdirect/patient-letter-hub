const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdminRole() {
  try {
    // Check current user
    const user = await prisma.user.findUnique({
      where: { email: 'bob@downtownmed.com' }
    });
    
    console.log('Current user:', user);
    
    if (user) {
      // Update to ADMIN role
      const updatedUser = await prisma.user.update({
        where: { email: 'bob@downtownmed.com' },
        data: { role: 'ADMIN' }
      });
      
      console.log('Updated user:', updatedUser);
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminRole(); 