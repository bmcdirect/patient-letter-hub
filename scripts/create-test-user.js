const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔍 Creating test user...');
    
    // First create a practice
    const practice = await prisma.practice.upsert({
      where: { id: 'test-practice-1' },
      update: {},
      create: {
        id: 'test-practice-1',
        name: 'Test Practice',
        address: '123 Test Street',
        phone: '555-1234',
        organizationId: 'dev_org_bypass'
      }
    });
    
    console.log('✅ Practice created:', practice.name);
    
    // Create a user
    const user = await prisma.user.upsert({
      where: { clerkId: 'dev_user_bypass' },
      update: {},
      create: {
        clerkId: 'dev_user_bypass',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        practiceId: practice.id,
        organizationId: 'dev_org_bypass'
      }
    });
    
    console.log('✅ User created:', user.name);
    console.log('✅ User ID:', user.id);
    console.log('✅ Practice ID:', user.practiceId);
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
