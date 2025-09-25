// Comprehensive Proof Flow Test Script
// Run this in browser console while logged in as admin to test the specific failing scenario

async function testProofFlow() {
  console.log('🔍 COMPREHENSIVE PROOF FLOW TEST');
  console.log('================================');
  console.log('Target: donnam@masscomminc.com accessing order O-1758821301148');
  console.log('');

  try {
    // Step 1: Get diagnostic data first
    console.log('1️⃣ GETTING DIAGNOSTIC DATA...');
    const diagnosticResponse = await fetch('/api/admin/diagnose-proof-access');
    
    if (!diagnosticResponse.ok) {
      console.error('❌ Diagnostic endpoint failed:', diagnosticResponse.status);
      return;
    }
    
    const diagnosticData = await diagnosticResponse.json();
    console.log('✅ Diagnostic data received');
    console.log('   User exists:', !!diagnosticData.user);
    console.log('   Order exists:', !!diagnosticData.order);
    console.log('   Proofs count:', diagnosticData.order?.proofsCount || 0);
    console.log('   Authorization will work:', diagnosticData.diagnosis?.proofAccessWillWork || false);
    
    if (!diagnosticData.user || !diagnosticData.order) {
      console.log('❌ Cannot proceed - missing user or order data');
      return;
    }
    
    const orderId = diagnosticData.order.id;
    const proofs = diagnosticData.proofs || [];
    
    if (proofs.length === 0) {
      console.log('❌ Cannot proceed - no proofs found for this order');
      return;
    }
    
    const latestProof = proofs[0]; // First proof (should be latest)
    console.log('   Latest proof:', {
      id: latestProof.id,
      proofRound: latestProof.proofRound,
      status: latestProof.status
    });
    
    console.log('');
    
    // Step 2: Test the proof-review API directly
    console.log('2️⃣ TESTING PROOF-REVIEW API DIRECTLY...');
    const proofReviewUrl = `/api/orders/${orderId}/proof-review?proofId=${latestProof.id}`;
    console.log('   API URL:', proofReviewUrl);
    
    const proofReviewResponse = await fetch(proofReviewUrl);
    console.log('   Response status:', proofReviewResponse.status);
    console.log('   Response ok:', proofReviewResponse.ok);
    
    const proofReviewData = await proofReviewResponse.json();
    console.log('   Response data:', proofReviewData);
    
    if (proofReviewResponse.ok) {
      console.log('✅ Proof-review API call successful');
      console.log('   Order data:', proofReviewData.order);
      console.log('   Proof data:', proofReviewData.proof);
    } else {
      console.log('❌ Proof-review API call failed');
      console.log('   Error:', proofReviewData.error);
      console.log('   Details:', proofReviewData.details);
    }
    
    console.log('');
    
    // Step 3: Test the frontend proof-review page URL
    console.log('3️⃣ TESTING FRONTEND PROOF-REVIEW PAGE URL...');
    const frontendUrl = `/orders/${orderId}/proof-review?proofId=${latestProof.id}`;
    console.log('   Frontend URL:', frontendUrl);
    console.log('   Full URL would be:', window.location.origin + frontendUrl);
    
    // Test if the page would load by checking the route
    console.log('   Testing page accessibility...');
    try {
      const pageResponse = await fetch(frontendUrl, { method: 'HEAD' });
      console.log('   Page response status:', pageResponse.status);
      console.log('   Page accessible:', pageResponse.ok);
    } catch (error) {
      console.log('   Page test error:', error.message);
    }
    
    console.log('');
    
    // Step 4: Simulate the complete user flow
    console.log('4️⃣ SIMULATING COMPLETE USER FLOW...');
    console.log('   Step 1: User clicks proof link in email');
    console.log('   Step 2: Browser navigates to:', frontendUrl);
    console.log('   Step 3: Frontend page loads and calls API:', proofReviewUrl);
    console.log('   Step 4: API processes request and returns data');
    
    // Check if the user would be authenticated
    console.log('   Authentication check:');
    const authResponse = await fetch('/api/user');
    if (authResponse.ok) {
      const userData = await authResponse.json();
      console.log('   ✅ User is authenticated:', userData.email);
      console.log('   User role:', userData.role);
      console.log('   User practice:', userData.practice?.name);
    } else {
      console.log('   ❌ User authentication failed');
    }
    
    console.log('');
    
    // Step 5: Identify the exact failure point
    console.log('5️⃣ FAILURE POINT ANALYSIS...');
    
    if (!diagnosticData.diagnosis?.proofAccessWillWork) {
      console.log('❌ ROOT CAUSE: Authorization will fail');
      console.log('   Issues:', diagnosticData.issues || []);
      console.log('   Root cause:', diagnosticData.diagnosis?.rootCause);
    } else if (!proofReviewResponse.ok) {
      console.log('❌ ROOT CAUSE: API call failed');
      console.log('   Error:', proofReviewData.error);
      console.log('   Details:', proofReviewData.details);
    } else {
      console.log('✅ FLOW SHOULD WORK: All checks passed');
      console.log('   If user still gets "Proof not found", check:');
      console.log('   1. Browser cache issues');
      console.log('   2. Network connectivity');
      console.log('   3. JavaScript errors in console');
      console.log('   4. URL parameters being modified');
    }
    
    console.log('');
    
    // Step 6: Provide actionable recommendations
    console.log('6️⃣ ACTIONABLE RECOMMENDATIONS...');
    
    if (diagnosticData.issues && diagnosticData.issues.length > 0) {
      console.log('   Fix these issues first:');
      diagnosticData.issues.forEach((issue, index) => {
        console.log(`     ${index + 1}. ${issue}`);
      });
    }
    
    if (!proofReviewResponse.ok) {
      console.log('   API Error Solutions:');
      if (proofReviewData.error === 'User not found') {
        console.log('     - Check if user has Clerk ID linked');
        console.log('     - Verify getCurrentUser() function works');
      } else if (proofReviewData.error === 'Order not found') {
        console.log('     - Check if order ID is correct');
        console.log('     - Verify order exists in database');
      } else if (proofReviewData.error === 'Proof not found') {
        console.log('     - Check if proof ID matches order');
        console.log('     - Verify proof exists for this order');
      } else if (proofReviewData.error === 'Unauthorized') {
        console.log('     - Check user ownership of order');
        console.log('     - Verify user role and permissions');
      }
    }
    
    console.log('');
    console.log('✅ PROOF FLOW TEST COMPLETE');
    console.log('Check the server logs for detailed API tracing information.');
    
    return {
      diagnosticData,
      proofReviewResponse: {
        status: proofReviewResponse.status,
        ok: proofReviewResponse.ok,
        data: proofReviewData
      },
      frontendUrl,
      apiUrl: proofReviewUrl
    };
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
  }
}

// Run the test
testProofFlow();
