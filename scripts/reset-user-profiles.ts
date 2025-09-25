import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetUserProfiles() {
  console.log('🔄 Resetting user profiles to trigger welcome emails...\n');

  const emailsToReset = ['cora@masscomminc.com', 'donnam@masscomminc.com'];

  for (const email of emailsToReset) {
    try {
      // Find the user by email
      const user = await prisma.user.findUnique({
        where: { email },
        include: { practice: true }
      });

      if (!user) {
        console.log(`❌ User not found: ${email}`);
        continue;
      }

      console.log(`👤 Found user: ${user.name} (${user.email})`);
      console.log(`   Current practiceId: ${user.practiceId || 'None'}`);
      console.log(`   Practice: ${user.practice?.name || 'None'}`);

      // Remove practice association to make them "new users" again
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { 
          practiceId: null,
          // Clear profile data to force re-setup
          name: null,
          title: null,
          taxonomyCode: null,
          npi1: null,
          npi2: null,
        }
      });

      console.log(`✅ Reset user profile: ${updatedUser.email}`);
      console.log(`   New practiceId: ${updatedUser.practiceId || 'None'}`);
      console.log(`   Profile data cleared - will trigger welcome email on next setup\n`);

    } catch (error) {
      console.error(`❌ Error resetting user ${email}:`, error);
    }
  }

  // Verify the reset
  console.log('🔍 Verifying reset results...');
  const resetUsers = await prisma.user.findMany({
    where: { 
      email: { in: emailsToReset }
    },
    include: { practice: true }
  });

  console.log('\n📋 Reset Summary:');
  resetUsers.forEach(user => {
    console.log(`👤 ${user.name} (${user.email})`);
    console.log(`   PracticeId: ${user.practiceId || 'None'}`);
    console.log(`   Practice: ${user.practice?.name || 'None'}`);
    console.log(`   Status: ${user.practiceId ? '❌ Still has practice' : '✅ Ready for welcome email'}`);
  });

  await prisma.$disconnect();
  console.log('\n✅ Profile reset completed!');
}

resetUserProfiles().catch(console.error);
