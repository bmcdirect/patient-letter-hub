// Test script to call the diagnostic endpoint
// Run this in browser console while logged in as admin

async function testDiagnosticEndpoint() {
  try {
    console.log('🔍 Testing diagnostic endpoint...');
    
    const response = await fetch('/api/admin/diagnose-user-order', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('❌ Diagnostic endpoint failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Diagnostic endpoint response:', data);
    
    // Analyze the results
    console.log('\n📊 ANALYSIS:');
    console.log('=============');
    
    // Check user data
    console.log('\n1️⃣ USER ANALYSIS:');
    console.log(`   Email: ${data.user?.email || 'Not found'}`);
    console.log(`   Name: ${data.user?.name || 'NULL/EMPTY'}`);
    console.log(`   Clerk ID: ${data.user?.clerkId || 'MISSING'}`);
    console.log(`   Role: ${data.user?.role || 'Unknown'}`);
    console.log(`   Practice ID: ${data.user?.practiceId || 'None'}`);
    console.log(`   Practice Name: ${data.user?.practiceName || 'None'}`);
    
    // Check order data
    console.log('\n2️⃣ ORDER ANALYSIS:');
    console.log(`   Order Number: ${data.order?.orderNumber || 'Not found'}`);
    console.log(`   Order ID: ${data.order?.id || 'Not found'}`);
    console.log(`   Status: ${data.order?.status || 'Unknown'}`);
    console.log(`   Order User ID: ${data.order?.userId || 'Not found'}`);
    console.log(`   Order User Email: ${data.order?.userEmail || 'Not found'}`);
    console.log(`   Order Practice ID: ${data.order?.practiceId || 'Not found'}`);
    console.log(`   Order Practice Name: ${data.order?.practiceName || 'Not found'}`);
    console.log(`   Proofs Count: ${data.order?.proofsCount || 0}`);
    
    // Check ownership
    console.log('\n3️⃣ OWNERSHIP ANALYSIS:');
    console.log(`   User owns order: ${data.ownershipCheck?.userOwnsOrder || false}`);
    console.log(`   Order belongs to user's practice: ${data.ownershipCheck?.orderBelongsToUserPractice || false}`);
    console.log(`   User has Clerk ID: ${data.ownershipCheck?.userHasClerkId || false}`);
    console.log(`   getCurrentUser would work: ${data.ownershipCheck?.getCurrentUserWouldFindUser || false}`);
    
    // Check proofs
    console.log('\n4️⃣ PROOFS ANALYSIS:');
    if (data.proofs && data.proofs.length > 0) {
      console.log(`   Found ${data.proofs.length} proofs:`);
      data.proofs.forEach((proof, index) => {
        console.log(`     Proof ${index + 1}:`);
        console.log(`       ID: ${proof.id}`);
        console.log(`       Round: ${proof.proofRound}`);
        console.log(`       Status: ${proof.status}`);
        console.log(`       File: ${proof.fileName || 'No file'}`);
        console.log(`       Uploaded: ${proof.uploadedAt}`);
      });
    } else {
      console.log('   No proofs found for this order');
    }
    
    // Check diagnosis
    console.log('\n5️⃣ DIAGNOSIS:');
    if (data.diagnosis) {
      console.log(`   User exists: ${data.diagnosis.userExists}`);
      console.log(`   Order exists: ${data.diagnosis.orderExists}`);
      console.log(`   User has Clerk ID: ${data.diagnosis.userHasClerkId}`);
      console.log(`   User owns order: ${data.diagnosis.userOwnsOrder}`);
      console.log(`   Order belongs to user's practice: ${data.diagnosis.orderBelongsToUserPractice}`);
      console.log(`   getCurrentUser would work: ${data.diagnosis.getCurrentUserWouldWork}`);
      console.log(`   Name field issue: ${data.diagnosis.nameFieldIssue || 'None'}`);
      
      if (data.diagnosis.possibleIssues && data.diagnosis.possibleIssues.length > 0) {
        console.log('\n   🚨 IDENTIFIED ISSUES:');
        data.diagnosis.possibleIssues.forEach((issue, index) => {
          console.log(`     ${index + 1}. ${issue}`);
        });
      }
    }
    
    // Check similar users
    console.log('\n6️⃣ SIMILAR USERS:');
    if (data.similarUsers && data.similarUsers.length > 0) {
      console.log(`   Found ${data.similarUsers.length} users with masscomminc.com email:`);
      data.similarUsers.forEach((user, index) => {
        console.log(`     ${index + 1}. ${user.email} (${user.name || 'No name'})`);
        console.log(`        Clerk ID: ${user.clerkId || 'MISSING'}`);
        console.log(`        Practice: ${user.practiceName || 'None'}`);
      });
    } else {
      console.log('   No similar users found');
    }
    
    // Provide recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('===================');
    
    if (!data.user?.clerkId) {
      console.log('❌ CRITICAL: User has no Clerk ID - this will cause getCurrentUser to fail');
      console.log('   Solution: Link user to Clerk account or create new user with Clerk ID');
    }
    
    if (!data.ownershipCheck?.userOwnsOrder) {
      console.log('❌ CRITICAL: User does not own the order');
      console.log(`   User ID: ${data.user?.id}`);
      console.log(`   Order User ID: ${data.order?.userId}`);
      console.log('   Solution: Check if order was created by different user or fix user ID');
    }
    
    if (!data.ownershipCheck?.orderBelongsToUserPractice) {
      console.log('❌ WARNING: Order does not belong to user\'s practice');
      console.log(`   User Practice ID: ${data.user?.practiceId}`);
      console.log(`   Order Practice ID: ${data.order?.practiceId}`);
      console.log('   Solution: Check practice associations');
    }
    
    if (data.order?.proofsCount === 0) {
      console.log('❌ CRITICAL: No proofs found for this order');
      console.log('   Solution: Check if proofs were created or if there\'s a linking issue');
    }
    
    if (!data.user?.name) {
      console.log('❌ WARNING: User name field is empty');
      console.log('   Solution: Update user profile with name information');
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Error calling diagnostic endpoint:', error);
  }
}

// Run the test
testDiagnosticEndpoint();
