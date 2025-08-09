const { Client } = require('pg');

async function setupDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'PatientHub2025!',
    database: 'postgres' // Connect to default database first
  });

  try {
    console.log('🔍 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if database exists
    const result = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = 'patientletterhub'
    `);

    if (result.rows.length === 0) {
      console.log('🔍 Creating database patientletterhub...');
      await client.query('CREATE DATABASE patientletterhub');
      console.log('✅ Database created');
    } else {
      console.log('✅ Database patientletterhub already exists');
    }

    // Test connection to the actual database
    await client.end();
    
    const testClient = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'PatientHub2025!',
      database: 'patientletterhub'
    });

    await testClient.connect();
    console.log('✅ Successfully connected to patientletterhub database');
    await testClient.end();

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check if the password is correct');
    console.log('3. Try connecting manually: psql -h localhost -U postgres');
  }
}

setupDatabase();
