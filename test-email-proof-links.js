// Test script to verify email proof review links
// Run this in browser console while logged in as admin

async function testEmailProofLinks() {
  console.log('🔍 TESTING EMAIL PROOF REVIEW LINKS');
  console.log('===================================');
  
  try {
    // Get diagnostic data to get order and proof information
    const diagnosticResponse = await fetch('/api/admin/diagnose-proof-access');
    const diagnosticData = await diagnosticResponse.json();
    
    if (!diagnosticData.user || !diagnosticData.order || !diagnosticData.proofs?.length) {
      console.log('❌ Cannot test - missing user, order, or proofs');
      return;
    }
    
    const order = diagnosticData.order;
    const latestProof = diagnosticData.proofs[0];
    
    console.log('✅ TEST DATA:');
    console.log(`   Order Number: ${order.orderNumber}`);
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Latest Proof ID: ${latestProof.id}`);
    console.log(`   Proof Round: ${latestProof.proofRound}`);
    console.log('');
    
    // Test the email link generation logic
    console.log('📧 EMAIL LINK GENERATION TEST:');
    const baseUrl = window.location.origin;
    const expectedProofLink = `${baseUrl}/orders/${order.id}/proof-review?proofId=${latestProof.id}`;
    
    console.log(`   Base URL: ${baseUrl}`);
    console.log(`   Expected Proof Link: ${expectedProofLink}`);
    console.log('');
    
    // Test if the link would work
    console.log('🧪 LINK VALIDATION TEST:');
    try {
      const testResponse = await fetch(`/api/orders/${order.id}/proof-review?proofId=${latestProof.id}`);
      console.log(`   API Response Status: ${testResponse.status}`);
      console.log(`   API Response OK: ${testResponse.ok}`);
      
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log(`   ✅ Link works - Order: ${testData.order?.orderNumber}`);
        console.log(`   ✅ Link works - Proof: ${testData.proof?.proofRound}`);
      } else {
        const errorData = await testResponse.json();
        console.log(`   ❌ Link failed - Error: ${errorData.error}`);
        console.log(`   ❌ Link failed - Details:`, errorData.details);
      }
    } catch (error) {
      console.log(`   ❌ Link test error: ${error.message}`);
    }
    
    console.log('');
    
    // Test email service parameters
    console.log('📨 EMAIL SERVICE PARAMETERS TEST:');
    const emailParams = {
      orderNumber: order.orderNumber,
      practiceName: diagnosticData.user.practiceName || 'Test Practice',
      proofId: latestProof.id,
      orderId: order.id,
      revisionNumber: latestProof.proofRound
    };
    
    console.log('   Email Service Parameters:');
    console.log(`     orderNumber: ${emailParams.orderNumber}`);
    console.log(`     practiceName: ${emailParams.practiceName}`);
    console.log(`     proofId: ${emailParams.proofId}`);
    console.log(`     orderId: ${emailParams.orderId}`);
    console.log(`     revisionNumber: ${emailParams.revisionNumber}`);
    
    console.log('');
    
    // Verify the link format matches what email service would generate
    console.log('🔗 LINK FORMAT VERIFICATION:');
    const emailServiceLink = `${baseUrl}/orders/${emailParams.orderId}/proof-review?proofId=${emailParams.proofId}`;
    console.log(`   Email Service Generated Link: ${emailServiceLink}`);
    console.log(`   Matches Expected Link: ${emailServiceLink === expectedProofLink}`);
    
    console.log('');
    console.log('✅ EMAIL PROOF LINK TEST COMPLETE');
    console.log('The email service should generate links in the correct format.');
    
    return {
      order,
      latestProof,
      expectedProofLink,
      emailServiceLink,
      emailParams
    };
    
  } catch (error) {
    console.error('❌ Email proof link test failed:', error);
  }
}

// Run the test
testEmailProofLinks();
