const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://plh_admin:Maryland2!@pLh3@patientletterhub-dev-postgres.postgres.database.azure.com:5432/patientletterhub_dev_db?sslmode=require"
    }
  }
});

async function addUser() {
  try {
    console.log('🔍 Adding user davids@masscomminc.com to database...');
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: 'user_32Vwkc1p7ojIJXaq8MVb8ShQfIe' }
    });
    
    if (existingUser) {
      console.log('✅ User already exists:', existingUser.email);
      return;
    }
    
    // Create the user
    const newUser = await prisma.user.create({
      data: {
        clerkId: 'user_32Vwkc1p7ojIJXaq8MVb8ShQfIe',
        email: 'davids@masscomminc.com',
        name: 'David Sweeney',
        role: 'USER',
        practiceId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('✅ User created successfully:', {
      id: newUser.id,
      email: newUser.email,
      clerkId: newUser.clerkId,
      role: newUser.role
    });
    
    // Verify the user was created
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        clerkId: true,
        role: true
      }
    });
    
    console.log('📋 All users in database:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.role} - ClerkID: ${user.clerkId}`);
    });
    
  } catch (error) {
    console.error('❌ Error adding user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addUser();
