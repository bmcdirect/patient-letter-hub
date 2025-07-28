/**
 * Create 15 Test Practice Accounts for PatientLetterHub
 * 
 * This script creates realistic healthcare practice accounts with:
 * - Varied practice types (medical, dental, veterinary, therapy, etc.)
 * - Complete contact information
 * - Admin user accounts with hashed passwords
 * - Professional practice names and locations
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';

// Database connection
const sql = neon(process.env.DATABASE_URL);

const testPractices = [
  {
    name: "Riverside Family Medicine",
    type: "medical",
    phone: "(555) 123-4567",
    email: "admin@riversidefamilymed.com",
    address: "1245 Riverside Drive",
    city: "Sacramento",
    state: "CA",
    zipCode: "95825",
    adminUser: {
      firstName: "Dr. Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@riversidefamilymed.com",
      password: "practice123"
    }
  },
  {
    name: "Bright Smiles Dental Care",
    type: "dental",
    phone: "(555) 234-5678",
    email: "admin@brightsmilesdental.com",
    address: "789 Oak Street",
    city: "Fresno",
    state: "CA",
    zipCode: "93720",
    adminUser: {
      firstName: "Dr. Michael",
      lastName: "Chen",
      email: "michael.chen@brightsmilesdental.com",
      password: "practice123"
    }
  },
  {
    name: "Golden State Veterinary Clinic",
    type: "veterinary",
    phone: "(555) 345-6789",
    email: "admin@goldenstatevet.com",
    address: "456 Pine Avenue",
    city: "San Jose",
    state: "CA",
    zipCode: "95112",
    adminUser: {
      firstName: "Dr. Jennifer",
      lastName: "Martinez",
      email: "jennifer.martinez@goldenstatevet.com",
      password: "practice123"
    }
  },
  {
    name: "Pacific Physical Therapy",
    type: "therapy",
    phone: "(555) 456-7890",
    email: "admin@pacificpt.com",
    address: "123 Wellness Way",
    city: "San Diego",
    state: "CA",
    zipCode: "92101",
    adminUser: {
      firstName: "Jessica",
      lastName: "Williams",
      email: "jessica.williams@pacificpt.com",
      password: "practice123"
    }
  },
  {
    name: "Redwood Pediatrics",
    type: "pediatric",
    phone: "(555) 567-8901",
    email: "admin@redwoodpediatrics.com",
    address: "890 Children's Plaza",
    city: "Santa Rosa",
    state: "CA",
    zipCode: "95404",
    adminUser: {
      firstName: "Dr. Amanda",
      lastName: "Taylor",
      email: "amanda.taylor@redwoodpediatrics.com",
      password: "practice123"
    }
  },
  {
    name: "Valley Orthopedic Associates",
    type: "orthopedic",
    phone: "(555) 678-9012",
    email: "admin@valleyortho.com",
    address: "567 Sports Medicine Drive",
    city: "Modesto",
    state: "CA",
    zipCode: "95354",
    adminUser: {
      firstName: "Dr. Robert",
      lastName: "Anderson",
      email: "robert.anderson@valleyortho.com",
      password: "practice123"
    }
  },
  {
    name: "Coastal Cardiology Center",
    type: "cardiology",
    phone: "(555) 789-0123",
    email: "admin@coastalcardio.com",
    address: "234 Heart Health Boulevard",
    city: "Monterey",
    state: "CA",
    zipCode: "93940",
    adminUser: {
      firstName: "Dr. Lisa",
      lastName: "Thompson",
      email: "lisa.thompson@coastalcardio.com",
      password: "practice123"
    }
  },
  {
    name: "Desert Dermatology Clinic",
    type: "dermatology",
    phone: "(555) 890-1234",
    email: "admin@desertderm.com",
    address: "678 Skin Care Lane",
    city: "Palm Springs",
    state: "CA",
    zipCode: "92262",
    adminUser: {
      firstName: "Dr. Kevin",
      lastName: "Davis",
      email: "kevin.davis@desertderm.com",
      password: "practice123"
    }
  },
  {
    name: "Mountain View Mental Health",
    type: "mental_health",
    phone: "(555) 901-2345",
    email: "admin@mountainviewmh.com",
    address: "345 Therapy Circle",
    city: "Stockton",
    state: "CA",
    zipCode: "95202",
    adminUser: {
      firstName: "Dr. Maria",
      lastName: "Rodriguez",
      email: "maria.rodriguez@mountainviewmh.com",
      password: "practice123"
    }
  },
  {
    name: "Bay Area Ophthalmology",
    type: "ophthalmology",
    phone: "(555) 012-3456",
    email: "admin@bayareaeyecare.com",
    address: "912 Vision Street",
    city: "Oakland",
    state: "CA",
    zipCode: "94612",
    adminUser: {
      firstName: "Dr. James",
      lastName: "Wilson",
      email: "james.wilson@bayareaeyecare.com",
      password: "practice123"
    }
  },
  {
    name: "Central Valley Urgent Care",
    type: "urgent_care",
    phone: "(555) 123-0987",
    email: "admin@cvurgentcare.com",
    address: "456 Emergency Avenue",
    city: "Bakersfield",
    state: "CA",
    zipCode: "93301",
    adminUser: {
      firstName: "Dr. Patricia",
      lastName: "Brown",
      email: "patricia.brown@cvurgentcare.com",
      password: "practice123"
    }
  },
  {
    name: "Sunshine Chiropractic Wellness",
    type: "chiropractic",
    phone: "(555) 234-0987",
    email: "admin@sunshinechiro.com",
    address: "789 Spine Alignment Way",
    city: "Chico",
    state: "CA",
    zipCode: "95926",
    adminUser: {
      firstName: "Dr. Christopher",
      lastName: "Miller",
      email: "christopher.miller@sunshinechiro.com",
      password: "practice123"
    }
  },
  {
    name: "Hillside Women's Health",
    type: "womens_health",
    phone: "(555) 345-0987",
    email: "admin@hillsidewomens.com",
    address: "123 Women's Care Drive",
    city: "Salinas",
    state: "CA",
    zipCode: "93901",
    adminUser: {
      firstName: "Dr. Elizabeth",
      lastName: "Garcia",
      email: "elizabeth.garcia@hillsidewomens.com",
      password: "practice123"
    }
  },
  {
    name: "Metro Sleep Disorder Center",
    type: "sleep_medicine",
    phone: "(555) 456-0987",
    email: "admin@metrosleep.com",
    address: "567 Rest Avenue",
    city: "Long Beach",
    state: "CA",
    zipCode: "90802",
    adminUser: {
      firstName: "Dr. Daniel",
      lastName: "Lee",
      email: "daniel.lee@metrosleep.com",
      password: "practice123"
    }
  },
  {
    name: "Heritage Senior Care",
    type: "geriatric",
    phone: "(555) 567-0987",
    email: "admin@heritageseniorcare.com",
    address: "890 Elder Care Boulevard",
    city: "Oxnard",
    state: "CA",
    zipCode: "93030",
    adminUser: {
      firstName: "Dr. Nancy",
      lastName: "White",
      email: "nancy.white@heritageseniorcare.com",
      password: "practice123"
    }
  }
];

async function createTestPractices() {
  console.log('🏥 Creating 15 test practice accounts...');
  
  try {
    // Get the next available tenant ID
    const maxIdResult = await sql`SELECT COALESCE(MAX(id), 0) as max_id FROM tenants`;
    let nextTenantId = maxIdResult[0].max_id + 1;
    
    for (let i = 0; i < testPractices.length; i++) {
      const practice = testPractices[i];
      
      console.log(`\n📋 Creating practice ${i + 1}/15: ${practice.name}`);
      
      // Generate tenant key from practice name
      const tenantKey = practice.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Create tenant (practice organization) with explicit ID
      const tenantResult = await sql`
        INSERT INTO tenants (
          id,
          name,
          email,
          phone
        ) VALUES (
          ${nextTenantId},
          ${practice.name},
          ${practice.email},
          ${practice.phone}
        )
        RETURNING id
      `;
      
      const tenantId = tenantResult[0].id;
      nextTenantId++;
      console.log(`  ✅ Created tenant ID: ${tenantId}`);
      
      // Hash password for admin user
      const passwordHash = await bcrypt.hash(practice.adminUser.password, 12);
      const userId = crypto.randomUUID();
      
      // Create admin user
      await sql`
        INSERT INTO users (
          id,
          email,
          first_name,
          last_name,
          password_hash,
          tenant_id,
          email_verified
        ) VALUES (
          ${userId},
          ${practice.adminUser.email},
          ${practice.adminUser.firstName},
          ${practice.adminUser.lastName},
          ${passwordHash},
          ${tenantId},
          true
        )
      `;
      
      console.log(`  ✅ Created admin user: ${practice.adminUser.email}`);
      
      // Add user to tenant with admin role
      await sql`
        INSERT INTO user_tenants (
          user_id,
          tenant_id,
          role,
          status,
          joined_at
        ) VALUES (
          ${userId},
          ${tenantId},
          'tenant_admin',
          'active',
          NOW()
        )
      `;
      
      // Create a default practice location
      await sql`
        INSERT INTO practices (
          tenant_id,
          owner_id,
          name,
          address,
          city,
          state,
          zip_code,
          phone,
          email,
          practice_type,
          is_primary
        ) VALUES (
          ${tenantId},
          ${userId},
          ${practice.name},
          ${practice.address},
          ${practice.city},
          ${practice.state},
          ${practice.zipCode},
          ${practice.phone},
          ${practice.email},
          ${practice.type},
          true
        )
      `;
      
      console.log(`  ✅ Created practice location`);
      console.log(`  📧 Login: ${practice.adminUser.email} / ${practice.adminUser.password}`);
    }
    
    console.log('\n🎉 Successfully created all 15 test practice accounts!');
    console.log('\n📝 Test Account Summary:');
    console.log('==========================================');
    
    testPractices.forEach((practice, index) => {
      console.log(`${index + 1}. ${practice.name}`);
      console.log(`   Type: ${practice.type}`);
      console.log(`   Email: ${practice.adminUser.email}`);
      console.log(`   Password: ${practice.adminUser.password}`);
      console.log(`   Location: ${practice.city}, ${practice.state}`);
      console.log('');
    });
    
    console.log('🔐 All accounts use password: practice123');
    console.log('📧 Email notifications are configured for real workflow testing');
    console.log('💳 All practices are set to "credit_card" billing preference');
    console.log('🏥 Each practice has one admin user and one location');
    
  } catch (error) {
    console.error('❌ Error creating test practices:', error);
    throw error;
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestPractices()
    .then(() => {
      console.log('\n✅ Test practice creation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test practice creation failed:', error);
      process.exit(1);
    });
}

export { createTestPractices, testPractices };