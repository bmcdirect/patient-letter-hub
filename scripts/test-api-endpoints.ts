import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAPIEndpoints() {
  console.log('🔍 Testing API endpoints as they would be called by the browser...\n');

  try {
    // Test 1: Simulate /api/user endpoint
    console.log('1️⃣ Testing /api/user endpoint...');
    const { userId } = await import('@clerk/nextjs/server').then(m => m.auth());
    
    if (!userId) {
      console.log('❌ No user authenticated');
      return;
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { practice: true }
    });

    if (!user) {
      // Try to find by email
      const clerkUser = await import('@clerk/nextjs/server').then(m => m.clerkClient.users.getUser(userId));
      const clerkEmail = clerkUser.emailAddresses[0]?.emailAddress;
      
      if (clerkEmail) {
        const userByEmail = await prisma.user.findUnique({
          where: { email: clerkEmail },
          include: { practice: true }
        });
        
        if (userByEmail) {
          console.log('✅ User found by email:');
          console.log(`   ID: ${userByEmail.id}`);
          console.log(`   Name: ${userByEmail.name}`);
          console.log(`   Email: ${userByEmail.email}`);
          console.log(`   Practice ID: ${userByEmail.practiceId || 'NOT ASSIGNED'}`);
          console.log(`   Practice Name: ${userByEmail.practice?.name || 'NOT ASSIGNED'}`);
        } else {
          console.log('❌ User not found by email either');
        }
      }
    } else {
      console.log('✅ User found by clerkId:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Practice ID: ${user.practiceId || 'NOT ASSIGNED'}`);
      console.log(`   Practice Name: ${user.practice?.name || 'NOT ASSIGNED'}`);
    }

    console.log('\n2️⃣ Testing /api/practices endpoint...');
    const practices = await prisma.practice.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✅ Found ${practices.length} practice(s):`);
    if (practices.length > 0) {
      practices.forEach((practice, index) => {
        console.log(`   ${index + 1}. ID: ${practice.id}`);
        console.log(`      Name: ${practice.name}`);
        console.log(`      Email: ${practice.email}`);
        console.log(`      Phone: ${practice.phone}`);
        console.log(`      Organization ID: ${practice.organizationId}`);
        console.log(`      Created: ${practice.createdAt.toLocaleDateString()}`);
      });
    }

    console.log('\n3️⃣ Testing /api/practices/[id] endpoint...');
    // Get the practice ID from the user
    const testUser = await prisma.user.findUnique({
      where: { id: 'cme3g2cko0000j2n2tn2fxubo' },
      include: { practice: true }
    });

    if (testUser?.practiceId) {
      const practice = await prisma.practice.findUnique({
        where: { id: testUser.practiceId }
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
        console.log(`❌ Practice with ID ${testUser.practiceId} not found`);
      }
    } else {
      console.log('❌ User has no practiceId assigned');
    }

  } catch (error) {
    console.error('❌ Error testing API endpoints:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAPIEndpoints();
