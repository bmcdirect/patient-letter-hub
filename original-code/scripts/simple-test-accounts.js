/**
 * Create Simple Test Accounts for PatientLetterHub
 * This creates test users for the existing tenant (ID: 1)
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const testUsers = [
  {
    firstName: "Dr. Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@riversidefamilymed.com",
    password: "practice123"
  },
  {
    firstName: "Dr. Michael",
    lastName: "Chen",
    email: "michael.chen@brightsmilesdental.com",
    password: "practice123"
  },
  {
    firstName: "Dr. Jennifer",
    lastName: "Martinez",
    email: "jennifer.martinez@goldenstatevet.com",
    password: "practice123"
  },
  {
    firstName: "Jessica",
    lastName: "Williams",
    email: "jessica.williams@pacificpt.com",
    password: "practice123"
  },
  {
    firstName: "Dr. Amanda",
    lastName: "Taylor",
    email: "amanda.taylor@redwoodpediatrics.com",
    password: "practice123"
  }
];

async function createTestUsers() {
  console.log('👥 Creating test user accounts...');
  
  try {
    const tenantId = 1; // Use existing tenant
    
    for (let i = 0; i < testUsers.length; i++) {
      const user = testUsers[i];
      
      console.log(`\n📋 Creating user ${i + 1}/${testUsers.length}: ${user.email}`);
      
      // Hash password
      const passwordHash = await bcrypt.hash(user.password, 12);
      const userId = crypto.randomUUID();
      
      // Check if user already exists
      const existingUser = await sql`
        SELECT id FROM users WHERE email = ${user.email}
      `;
      
      if (existingUser.length > 0) {
        console.log(`  ⚠️  User already exists: ${user.email}`);
        continue;
      }
      
      // Create user
      await sql`
        INSERT INTO users (
          id,
          email,
          first_name,
          last_name,
          password_hash,
          tenant_id
        ) VALUES (
          ${userId},
          ${user.email},
          ${user.firstName},
          ${user.lastName},
          ${passwordHash},
          ${tenantId}
        )
      `;
      
      console.log(`  ✅ Created user: ${user.email}`);
      console.log(`  🔐 Password: ${user.password}`);
    }
    
    console.log('\n🎉 Successfully created test user accounts!');
    console.log('\n📝 Test Account Summary:');
    console.log('==========================================');
    
    testUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log('');
    });
    
    console.log('🔐 All accounts use password: practice123');
    console.log('🏥 All users are in tenant ID: 1');
    
  } catch (error) {
    console.error('❌ Error creating test users:', error);
    throw error;
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestUsers()
    .then(() => {
      console.log('\n✅ Test user creation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test user creation failed:', error);
      process.exit(1);
    });
}

export { createTestUsers };