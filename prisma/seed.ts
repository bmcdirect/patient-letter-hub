/**
 * Idempotent Prisma Seed Script
 * 
 * This seed script creates:
 * - 3 Practices with specific slugs
 * - 4 Clerk users mapped to practices (except SuperUser)
 * - SuperUser with ADMIN role and no practice
 * 
 * ROLLBACK PLAN:
 * To split dev/prod environments later:
 * 1. Create new Azure Postgres database for dev (e.g., patientletterhub_dev_db)
 * 2. Set .env.local to dev DB: /patientletterhub_dev_db?sslmode=require
 * 3. Keep Vercel on /postgres (production)
 * 4. Run migrations and seed against both DBs
 * 5. This seed is idempotent - safe to run multiple times
 */

import { PrismaClient, UserRole } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting idempotent seed process...');

  // 1. UPSERT PRACTICES (create if they don't exist)
  console.log('🏢 Upserting Practices...');
  
  const practices = [
    {
      name: 'Harbor Family Dental',
      address: '123 Harbor St, Harbor City',
      phone: '555-123-4567',
      email: 'info@harborfamilydental.com',
      addressLine1: '123 Harbor St',
      city: 'Harbor City',
      state: 'CA',
      zipCode: '90210',
    },
    {
      name: 'Eastside Orthodontics',
      address: '456 East Ave, Eastside',
      phone: '555-987-6543',
      email: 'contact@eastsideortho.com',
      addressLine1: '456 East Ave',
      city: 'Eastside',
      state: 'NY',
      zipCode: '10001',
    },
    {
      name: 'Green Valley Pediatrics',
      address: '789 Valley Rd, Green Valley',
      phone: '555-456-7890',
      email: 'hello@greenvalleypeds.com',
      addressLine1: '789 Valley Rd',
      city: 'Green Valley',
      state: 'TX',
      zipCode: '75001',
    },
  ];

  const upsertedPractices: any[] = [];
  for (const practiceData of practices) {
    // Check if practice exists by name
    const existingPractice = await prisma.practice.findFirst({
      where: { name: practiceData.name },
    });

    let practice;
    if (existingPractice) {
      // Update existing practice
      practice = await prisma.practice.update({
        where: { id: existingPractice.id },
        data: {
          address: practiceData.address,
          phone: practiceData.phone,
          email: practiceData.email,
          addressLine1: practiceData.addressLine1,
          city: practiceData.city,
          state: practiceData.state,
          zipCode: practiceData.zipCode,
        },
      });
    } else {
      // Create new practice
      practice = await prisma.practice.create({
        data: practiceData,
      });
    }
    upsertedPractices.push(practice);
    console.log(`✅ Upserted Practice: ${practice.name}`);
  }

  // 2. UPSERT CLERK USERS (by clerkId)
  console.log('👥 Upserting Clerk users...');
  
  const clerkUsers = [
    {
      name: 'David Sweeney',
      email: 'davids@masscomminc.com',
      clerkId: 'user_32WPcZdVcjOkyWt3olYvqY0twKO',
      role: UserRole.USER,
      practiceName: 'Harbor Family Dental',
    },
    {
      name: 'Dave Sweeney',
      email: 'daves@masscomminc.com',
      clerkId: 'user_32VitH2bLPzzXqrCgQZ8mOYhQZ1',
      role: UserRole.USER,
      practiceName: 'Eastside Orthodontics',
    },
    {
      name: 'BMC Direct',
      email: 'bmcdirect1@gmail.com',
      clerkId: 'user_32VrieROt25wJPtVhgqCcQELnES',
      role: UserRole.USER,
      practiceName: 'Green Valley Pediatrics',
    },
    {
      name: 'Super Admin',
      email: 'superadmin@masscomminc.com',
      clerkId: 'user_32VrjrZXuTCOfQjs9BEvkRcYGux',
      role: UserRole.ADMIN,
      practiceName: null, // No practice for SuperUser
    },
  ];

  const upsertedUsers: any[] = [];
  for (const userData of clerkUsers) {
    // Find practice if specified
    const practice = userData.practiceName 
      ? upsertedPractices.find(p => p.name === userData.practiceName)
      : null;

    const user = await prisma.user.upsert({
      where: { clerkId: userData.clerkId },
      update: {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        practiceId: practice?.id || null,
      },
      create: {
        name: userData.name,
        email: userData.email,
        clerkId: userData.clerkId,
        role: userData.role,
        practiceId: practice?.id || null,
      },
    });
    upsertedUsers.push(user);
    console.log(`✅ Upserted User: ${user.name} (${user.email}) - ${practice ? `Practice: ${practice.name}` : 'No Practice (SuperUser)'}`);
  }

  // 3. VERIFY SEED RESULTS
  console.log('🔍 Verifying seed results...');
  
  const allUsers = await prisma.user.findMany({
    include: { practice: true },
  });
  
  const allPractices = await prisma.practice.findMany({
    include: { users: true },
  });

  console.log('\n📋 SEED SUMMARY:');
  console.log(`🏢 Practices: ${allPractices.length}`);
  console.log(`👥 Total Users: ${allUsers.length}`);
  console.log(`👑 SuperUsers (no practice): ${allUsers.filter(u => !u.practiceId).length}`);
  console.log(`👤 Practice Users: ${allUsers.filter(u => u.practiceId).length}`);
  
  console.log('\n🏢 PRACTICE BREAKDOWN:');
  for (const practice of allPractices) {
    console.log(`\n${practice.name}:`);
    console.log(`  👥 Users: ${practice.users.length}`);
    practice.users.forEach(user => {
      console.log(`    - ${user.name} (${user.email}) [${user.role}]`);
    });
  }

  console.log('\n👑 SUPERUSERS:');
  const superUsers = allUsers.filter(u => !u.practiceId);
  superUsers.forEach(user => {
    console.log(`  - ${user.name} (${user.email}) [${user.role}]`);
  });

  console.log('\n✅ Idempotent seed completed successfully!');
  console.log('🔄 Safe to re-run - all operations use upsert patterns');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 