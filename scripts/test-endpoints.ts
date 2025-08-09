import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testEndpoints() {
  console.log('🔍 Testing API endpoints...\n');

  try {
    // Test 1: Check user data
    console.log('1️⃣ Testing /api/user endpoint...');
    const user = await prisma.user.findUnique({
      where: { id: 'cme3g2cko0000j2n2tn2fxubo' },
      include: { practice: true }
    });
    
    if (user) {
      console.log('✅ User found:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Practice ID: ${user.practiceId || 'NOT ASSIGNED'}`);
      console.log(`   Practice Name: ${user.practice?.name || 'NOT ASSIGNED'}`);
    } else {
      console.log('❌ User not found');
    }

    console.log('\n2️⃣ Testing /api/practices endpoint...');
    const practices = await prisma.practice.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    if (practices.length > 0) {
      console.log(`✅ Found ${practices.length} practice(s):`);
      practices.forEach((practice, index) => {
        console.log(`   ${index + 1}. ID: ${practice.id}`);
        console.log(`      Name: ${practice.name}`);
        console.log(`      Email: ${practice.email}`);
        console.log(`      Phone: ${practice.phone}`);
        console.log(`      Organization ID: ${practice.organizationId}`);
        console.log(`      Created: ${practice.createdAt.toLocaleDateString()}`);
      });
    } else {
      console.log('❌ No practices found');
    }

    console.log('\n3️⃣ Testing /api/practices/[id] endpoint...');
    if (user?.practiceId) {
      const practice = await prisma.practice.findUnique({
        where: { id: user.practiceId }
      });
      
      if (practice) {
        console.log('✅ Practice details found:');
        console.log(`   ID: ${practice.id}`);
        console.log(`   Name: ${practice.name}`);
        console.log(`   Email: ${practice.email}`);
        console.log(`   Phone: ${practice.phone}`);
        console.log(`   Address: ${practice.address || 'NOT SET'}`);
        console.log(`   Organization ID: ${practice.organizationId}`);
        console.log(`   Created: ${practice.createdAt.toLocaleDateString()}`);
      } else {
        console.log(`❌ Practice with ID ${user.practiceId} not found`);
      }
    } else {
      console.log('❌ User has no practiceId assigned');
    }

  } catch (error) {
    console.error('❌ Error testing endpoints:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testEndpoints();
