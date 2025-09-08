#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const DATABASE_URL = "postgresql://plh_admin:Maryland2%21%40pLh3@patientletterhub-dev-postgres.postgres.database.azure.com:5432/patientletterhub_dev_db?sslmode=require";

async function testConnection() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
  });

  try {
    console.log('🔍 Testing database connection...');
    console.log(`📊 Database: ${DATABASE_URL.split('@')[1]?.split('/')[0] || 'Unknown'}`);
    
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT version() as version`;
    console.log('✅ Database connection successful!');
    console.log('📋 Database version:', result);
    
    // Test user table access
    const userCount = await prisma.user.count();
    console.log(`👥 Current user count: ${userCount}`);
    
    // List existing users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        name: true
      }
    });
    
    if (users.length > 0) {
      console.log('\n👥 Existing users:');
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.role})`);
      });
    } else {
      console.log('\n👥 No existing users found');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Can\'t reach database server')) {
        console.log('\n💡 Possible solutions:');
        console.log('   1. Check if the Azure PostgreSQL server is running');
        console.log('   2. Verify firewall rules allow connections from your IP');
        console.log('   3. Check if the connection string is correct');
        console.log('   4. Ensure SSL mode is properly configured');
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
