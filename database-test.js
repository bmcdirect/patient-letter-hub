const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://plh_admin:Maryland2!@pLh3@patientletterhub-dev-postgres.postgres.database.azure.com:5432/patientletterhub_dev_db?sslmode=require"
});

async function testDatabase() {
  try {
    await client.connect();
    console.log('✅ Connected to Azure PostgreSQL');
    
    const result = await client.query('SELECT email, role, "clerkId" FROM users ORDER BY email');
    console.log('📊 Users in database:', result.rows.length);
    
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.role} - ClerkID: ${user.clerkId}`);
    });
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await client.end();
  }
}

testDatabase();
