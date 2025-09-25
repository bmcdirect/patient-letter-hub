import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSpecificUserOrder() {
  console.log('🔍 CHECKING SPECIFIC USER AND ORDER');
  console.log('===================================\n');

  const targetEmail = 'donnam@masscomminc.com';
  const targetOrderNumber = 'O-1758821301148';

  try {
    // 1. Check the specific user
    console.log('1️⃣ CHECKING USER:', targetEmail);
    console.log('-------------------');
    
    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: { 
        practice: true,
        orders: {
          include: { practice: true }
        }
      }
    });

    if (!user) {
      console.log(`❌ User not found: ${targetEmail}`);
      return;
    }

    console.log(`✅ User found: ${user.name || 'No name'} (${user.email})`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Clerk ID: ${user.clerkId || 'None'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Practice ID: ${user.practiceId || 'None'}`);
    console.log(`   Practice Name: ${user.practice?.name || 'None'}`);
    console.log(`   Title: ${user.title || 'None'}`);
    console.log(`   Taxonomy Code: ${user.taxonomyCode || 'None'}`);
    console.log(`   NPI1: ${user.npi1 || 'None'}`);
    console.log(`   NPI2: ${user.npi2 || 'None'}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log(`   Updated: ${user.updatedAt}`);
    console.log(`   Orders Count: ${user.orders.length}`);
    console.log('');

    // 2. Check the specific order
    console.log('2️⃣ CHECKING ORDER:', targetOrderNumber);
    console.log('-------------------');
    
    const order = await prisma.orders.findUnique({
      where: { orderNumber: targetOrderNumber },
      include: {
        user: true,
        practice: true,
        proofs: {
          orderBy: { proofRound: 'desc' }
        }
      }
    });

    if (!order) {
      console.log(`❌ Order not found: ${targetOrderNumber}`);
      return;
    }

    console.log(`✅ Order found: ${order.orderNumber}`);
    console.log(`   ID: ${order.id}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   User ID: ${order.userId}`);
    console.log(`   User Email: ${order.user?.email || 'None'}`);
    console.log(`   Practice ID: ${order.practiceId}`);
    console.log(`   Practice Name: ${order.practice?.name || 'None'}`);
    console.log(`   Subject: ${order.subject || 'None'}`);
    console.log(`   Created: ${order.createdAt}`);
    console.log(`   Updated: ${order.updatedAt}`);
    console.log(`   Proofs Count: ${order.proofs.length}`);
    console.log('');

    // 3. Check if user owns the order
    console.log('3️⃣ CHECKING OWNERSHIP:');
    console.log('----------------------');
    
    if (order.userId === user.id) {
      console.log('✅ User owns the order');
    } else {
      console.log('❌ User does NOT own the order');
      console.log(`   Order User ID: ${order.userId}`);
      console.log(`   User ID: ${user.id}`);
    }

    if (order.practiceId === user.practiceId) {
      console.log('✅ Order belongs to user\'s practice');
    } else {
      console.log('❌ Order does NOT belong to user\'s practice');
      console.log(`   Order Practice ID: ${order.practiceId}`);
      console.log(`   User Practice ID: ${user.practiceId}`);
    }
    console.log('');

    // 4. Check proofs for this order
    console.log('4️⃣ CHECKING PROOFS:');
    console.log('-------------------');
    
    if (order.proofs.length > 0) {
      order.proofs.forEach((proof, index) => {
        console.log(`   Proof ${index + 1}:`);
        console.log(`     ID: ${proof.id}`);
        console.log(`     Round: ${proof.proofRound}`);
        console.log(`     Status: ${proof.status}`);
        console.log(`     File Name: ${proof.fileName || 'None'}`);
        console.log(`     Created: ${proof.uploadedAt}`);
        console.log('');
      });
    } else {
      console.log('   No proofs found for this order');
    }

    // 5. Test getCurrentUser logic
    console.log('5️⃣ TESTING getCurrentUser LOGIC:');
    console.log('--------------------------------');
    
    if (user.clerkId) {
      console.log(`✅ User has Clerk ID: ${user.clerkId}`);
      console.log('   getCurrentUser should find this user by clerkId');
    } else {
      console.log('❌ User has NO Clerk ID');
      console.log('   getCurrentUser will NOT find this user');
      console.log('   This is likely the root cause of the issue!');
    }

    // 6. Check all users with similar emails
    console.log('\n6️⃣ CHECKING SIMILAR USERS:');
    console.log('---------------------------');
    
    const similarUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'masscomminc.com'
        }
      },
      include: { practice: true }
    });

    console.log(`Found ${similarUsers.length} users with masscomminc.com email:`);
    similarUsers.forEach((u, index) => {
      console.log(`${index + 1}. ${u.email} (${u.name || 'No name'})`);
      console.log(`   Clerk ID: ${u.clerkId || 'None'}`);
      console.log(`   Practice: ${u.practice?.name || 'None'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error checking user and order:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpecificUserOrder();
