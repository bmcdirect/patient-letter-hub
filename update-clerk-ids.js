const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://plh_admin:Maryland2!@pLh3@patientletterhub-dev-postgres.postgres.database.azure.com:5432/patientletterhub_dev_db?sslmode=require"
});

async function updateClerkIds() {
  const updates = [
    { email: 'superadmin@masscomminc.com', clerkId: 'user_314b0h210YO1X1IwZjrnigzSFa9' },
    { email: 'daves@masscomminc.com', clerkId: 'user_32NOEPQuaOEb4Nkccrvxb4qB5pb' },
    { email: 'bmcdirect1@gmail.com', clerkId: 'user_3298o2Q5dfmbuZ278wginn2FFd9' }
  ];
  
  try {
    await client.connect();
    console.log('✅ Connected to Azure PostgreSQL');
    
    for (const update of updates) {
      const result = await client.query('UPDATE users SET "clerkId" = $1 WHERE email = $2', [update.clerkId, update.email]);
      console.log(`✅ Updated ${update.email} with clerkId: ${update.clerkId}`);
    }
    console.log('🎉 All Clerk IDs updated successfully');
  } catch (error) {
    console.error('❌ Update failed:', error.message);
  } finally {
    await client.end();
  }
}

updateClerkIds();
