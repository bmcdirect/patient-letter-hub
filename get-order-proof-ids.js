// Quick Order/Proof ID Test
// Run this to get the exact IDs for the failing scenario

async function getOrderProofIds() {
  console.log('🔍 GETTING ORDER AND PROOF IDs FOR FAILING SCENARIO');
  console.log('==================================================');
  
  try {
    // Get diagnostic data
    const response = await fetch('/api/admin/diagnose-proof-access');
    const data = await response.json();
    
    if (!data.user || !data.order) {
      console.log('❌ Missing user or order data');
      return;
    }
    
    console.log('✅ ORDER AND PROOF INFORMATION:');
    console.log('');
    console.log('📋 ORDER DETAILS:');
    console.log(`   Order Number: ${data.order.orderNumber}`);
    console.log(`   Order ID: ${data.order.id}`);
    console.log(`   Order Status: ${data.order.status}`);
    console.log(`   Order User ID: ${data.order.userId}`);
    console.log(`   Order Practice ID: ${data.order.practiceId}`);
    console.log('');
    
    console.log('👤 USER DETAILS:');
    console.log(`   User Email: ${data.user.email}`);
    console.log(`   User ID: ${data.user.id}`);
    console.log(`   User Name: ${data.user.name || 'NULL/EMPTY'}`);
    console.log(`   User Clerk ID: ${data.user.clerkId || 'MISSING'}`);
    console.log(`   User Role: ${data.user.role}`);
    console.log(`   User Practice ID: ${data.user.practiceId}`);
    console.log('');
    
    console.log('📄 PROOF DETAILS:');
    if (data.proofs && data.proofs.length > 0) {
      data.proofs.forEach((proof, index) => {
        console.log(`   Proof ${index + 1}:`);
        console.log(`     ID: ${proof.id}`);
        console.log(`     Round: ${proof.proofRound}`);
        console.log(`     Status: ${proof.status}`);
        console.log(`     File Name: ${proof.fileName || 'None'}`);
        console.log(`     Uploaded At: ${proof.uploadedAt}`);
        console.log('');
      });
      
      const latestProof = data.proofs[0];
      console.log('🔗 TESTING URLS:');
      console.log(`   API URL: /api/orders/${data.order.id}/proof-review?proofId=${latestProof.id}`);
      console.log(`   Frontend URL: /orders/${data.order.id}/proof-review?proofId=${latestProof.id}`);
      console.log('');
      
      console.log('🧪 QUICK API TEST:');
      const apiUrl = `/api/orders/${data.order.id}/proof-review?proofId=${latestProof.id}`;
      const apiResponse = await fetch(apiUrl);
      console.log(`   API Response Status: ${apiResponse.status}`);
      console.log(`   API Response OK: ${apiResponse.ok}`);
      
      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.log(`   API Error: ${errorData.error}`);
        console.log(`   API Details:`, errorData.details);
      } else {
        const successData = await apiResponse.json();
        console.log(`   ✅ API Success - Order: ${successData.order?.orderNumber}`);
        console.log(`   ✅ API Success - Proof: ${successData.proof?.proofRound}`);
      }
      
    } else {
      console.log('   ❌ No proofs found for this order');
    }
    
    console.log('');
    console.log('📊 AUTHORIZATION CHECK:');
    console.log(`   User owns order: ${data.ownershipCheck?.userOwnsOrder || false}`);
    console.log(`   Order belongs to user's practice: ${data.ownershipCheck?.orderBelongsToUserPractice || false}`);
    console.log(`   User has Clerk ID: ${data.ownershipCheck?.userHasClerkId || false}`);
    console.log(`   User is admin: ${data.ownershipCheck?.userIsAdmin || false}`);
    console.log(`   Proof access will work: ${data.diagnosis?.proofAccessWillWork || false}`);
    
    if (data.issues && data.issues.length > 0) {
      console.log('');
      console.log('🚨 IDENTIFIED ISSUES:');
      data.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    
    return {
      orderId: data.order.id,
      orderNumber: data.order.orderNumber,
      userId: data.user.id,
      userEmail: data.user.email,
      proofs: data.proofs,
      latestProof: data.proofs?.[0],
      apiUrl: data.proofs?.[0] ? `/api/orders/${data.order.id}/proof-review?proofId=${data.proofs[0].id}` : null,
      frontendUrl: data.proofs?.[0] ? `/orders/${data.order.id}/proof-review?proofId=${data.proofs[0].id}` : null
    };
    
  } catch (error) {
    console.error('❌ Error getting order/proof IDs:', error);
  }
}

// Run the test
getOrderProofIds();
