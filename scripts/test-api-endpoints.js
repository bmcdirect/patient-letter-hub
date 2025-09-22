const fetch = require('node-fetch');

async function testAPIEndpoints() {
  const baseUrl = 'http://localhost:3002';
  const orderId = 'cmfvi7nka0001vp29vhyi3mqg'; // Order with files
  
  console.log('🔍 Testing API endpoints...');
  
  try {
    // Test the files endpoint
    console.log(`\n🔍 Testing /api/orders/${orderId}/files`);
    const filesResponse = await fetch(`${baseUrl}/api/orders/${orderId}/files`);
    console.log(`Status: ${filesResponse.status}`);
    console.log(`Status Text: ${filesResponse.statusText}`);
    
    if (filesResponse.ok) {
      const filesData = await filesResponse.json();
      console.log('Files data:', JSON.stringify(filesData, null, 2));
    } else {
      const errorText = await filesResponse.text();
      console.log('Error response:', errorText);
    }
    
    // Test a specific file download (if files exist)
    console.log(`\n🔍 Testing file download...`);
    const fileId = 'test-file-id'; // This will fail but we can see the response
    const fileResponse = await fetch(`${baseUrl}/api/files/${fileId}`);
    console.log(`File download status: ${fileResponse.status}`);
    console.log(`File download status text: ${fileResponse.statusText}`);
    
    if (!fileResponse.ok) {
      const errorText = await fileResponse.text();
      console.log('File download error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error testing API endpoints:', error);
  }
}

testAPIEndpoints();
