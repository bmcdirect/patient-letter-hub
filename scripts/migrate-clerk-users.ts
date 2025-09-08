import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateClerkUsers() {
  console.log('🚀 Starting Clerk users migration to Azure PostgreSQL...');
  
  try {
    // Define the users to migrate
    const usersToMigrate = [
      {
        clerkId: 'user_32NOEPQuaOEb4Nkccrvxb4qB5pb',
        email: 'daves@masscomminc.com',
        name: 'David Sweeney',
        role: 'ADMIN' as const,
        practiceId: null, // Will be assigned later by admin
      },
      {
        clerkId: 'user_3298o2Q5dfmbuZ278wginn2FFd9',
        email: 'bmcdirect1@gmail.com',
        name: 'BMC Direct User',
        role: 'USER' as const,
        practiceId: null, // Will be assigned later by admin
      },
      {
        clerkId: 'user_314b0h210YO1X1IwZjrnigzSFa9',
        email: 'superadmin@masscomminc.com',
        name: 'Super Admin',
        role: 'ADMIN' as const,
        practiceId: null, // SuperAdmin doesn't need practice assignment
      }
    ];

    console.log('📋 Users to migrate:', usersToMigrate.length);

    // Check if users already exist
    for (const userData of usersToMigrate) {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { clerkId: userData.clerkId },
            { email: userData.email }
          ]
        }
      });

      if (existingUser) {
        console.log(`⚠️  User already exists: ${userData.email} (${existingUser.clerkId || 'no clerkId'})`);
        
        // Update existing user with Clerk ID if missing
        if (!existingUser.clerkId && userData.clerkId) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { clerkId: userData.clerkId }
          });
          console.log(`✅ Updated existing user with Clerk ID: ${userData.email}`);
        }
        continue;
      }

      // Create new user
      const newUser = await prisma.user.create({
        data: {
          clerkId: userData.clerkId,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          practiceId: userData.practiceId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });

      console.log(`✅ Created user: ${newUser.email} (${newUser.role}) - ID: ${newUser.id}`);
    }

    // Verify migration results
    console.log('\n🔍 Verifying migration results...');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        clerkId: true,
        role: true,
        practiceId: true,
        createdAt: true
      },
      orderBy: { email: 'asc' }
    });

    console.log('\n📊 Current users in database:');
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - Clerk ID: ${user.clerkId || 'MISSING'}`);
    });

    // Security validation
    const adminUsers = allUsers.filter(user => user.role === 'ADMIN');
    console.log(`\n🔒 Security validation:`);
    console.log(`  - Total users: ${allUsers.length}`);
    console.log(`  - Admin users: ${adminUsers.length}`);
    console.log(`  - Regular users: ${allUsers.length - adminUsers.length}`);

    if (adminUsers.length > 0) {
      console.log(`  - Admin emails: ${adminUsers.map(u => u.email).join(', ')}`);
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateClerkUsers()
  .then(() => {
    console.log('🎉 Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });
