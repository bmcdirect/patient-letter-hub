#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const DATABASE_URL = "postgresql://plh_admin:Maryland2%21%40pLh3@patientletterhub-dev-postgres.postgres.database.azure.com:5432/patientletterhub_dev_db?sslmode=require";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

interface UserToMigrate {
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  clerkId?: string;
}

const usersToMigrate: UserToMigrate[] = [
  {
    email: 'superadmin@masscomminc.com',
    name: 'Super Admin',
    role: 'ADMIN',
    clerkId: 'clerk_superadmin_id', // This will be updated when we get the actual Clerk ID
  },
  {
    email: 'daves@masscomminc.com',
    name: 'Dave Sweeney',
    role: 'USER', // CORRECTED: This should be USER, not ADMIN
    clerkId: 'clerk_daves_id',
  },
  {
    email: 'bmcdirect1@gmail.com',
    name: 'BMC Direct',
    role: 'USER',
    clerkId: 'clerk_bmc_id',
  },
];

async function migrateUsers() {
  try {
    console.log('🚀 Starting Clerk user migration to Azure PostgreSQL...');
    console.log(`📊 Database: ${DATABASE_URL.split('@')[1]?.split('/')[0] || 'Unknown'}`);
    
    // First, let's check if users already exist
    console.log('\n🔍 Checking for existing users...');
    const existingUsers = await prisma.user.findMany({
      where: {
        email: {
          in: usersToMigrate.map(u => u.email)
        }
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true
      }
    });

    if (existingUsers.length > 0) {
      console.log('⚠️  Found existing users:');
      existingUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.role})`);
      });
      
      console.log('\n🗑️  Removing existing users to ensure clean migration...');
      await prisma.user.deleteMany({
        where: {
          email: {
            in: usersToMigrate.map(u => u.email)
          }
        }
      });
      console.log('✅ Existing users removed');
    }

    // Create users with correct roles
    console.log('\n👥 Creating users with correct roles...');
    
    for (const userData of usersToMigrate) {
      console.log(`   Creating ${userData.email} as ${userData.role}...`);
      
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          clerkId: userData.clerkId,
          emailVerified: new Date(), // Mark as verified since they're migrating from Clerk
        },
      });
      
      console.log(`   ✅ Created user: ${user.email} (ID: ${user.id}, Role: ${user.role})`);
    }

    // Verify the migration
    console.log('\n🔍 Verifying migration results...');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`\n📊 Total users in database: ${allUsers.length}`);
    console.log('\n👥 User details:');
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email}`);
      console.log(`      - Name: ${user.name}`);
      console.log(`      - Role: ${user.role}`);
      console.log(`      - ID: ${user.id}`);
      console.log(`      - Created: ${user.createdAt.toISOString()}`);
      console.log('');
    });

    // Count roles
    const adminCount = allUsers.filter(u => u.role === 'ADMIN').length;
    const userCount = allUsers.filter(u => u.role === 'USER').length;
    
    console.log('📈 Role distribution:');
    console.log(`   - ADMIN: ${adminCount}`);
    console.log(`   - USER: ${userCount}`);

    // Verify the critical requirement
    if (adminCount === 1 && userCount === 2) {
      console.log('\n✅ MIGRATION SUCCESSFUL!');
      console.log('   ✓ Exactly 1 ADMIN account (superadmin@masscomminc.com)');
      console.log('   ✓ Exactly 2 USER accounts (daves@masscomminc.com, bmcdirect1@gmail.com)');
      console.log('   ✓ Only superadmin@masscomminc.com has administrative privileges');
    } else {
      console.log('\n❌ MIGRATION FAILED!');
      console.log(`   Expected: 1 ADMIN, 2 USER`);
      console.log(`   Actual: ${adminCount} ADMIN, ${userCount} USER`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateUsers();
