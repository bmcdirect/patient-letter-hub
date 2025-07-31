import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking database users...');
  
  try {
    const users = await prisma.user.findMany({
      include: {
        practice: true
      }
    });

    console.log(`✅ Found ${users.length} users in database:`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name}) - Role: ${user.role} - Practice: ${user.practice?.name || 'None'}`);
    });

    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('💡 Run: npx tsx scripts/seed-test-users.ts');
    }

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 