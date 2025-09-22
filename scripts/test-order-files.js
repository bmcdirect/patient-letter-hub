const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testOrderFiles() {
  try {
    console.log('🔍 Testing order files functionality...');
    
    // Test the specific order IDs mentioned
    const testOrderIds = [
      'cmfvfwta7000155ur2gpf4mij',
      'cmfvi7nka0001vp29vhyi3mqg'
    ];
    
    for (const orderId of testOrderIds) {
      console.log(`\n🔍 Testing order: ${orderId}`);
      
      // Check if order exists
      const order = await prisma.orders.findUnique({
        where: { id: orderId },
        include: {
          practice: true,
          user: true,
          files: true
        }
      });
      
      if (!order) {
        console.log(`❌ Order not found: ${orderId}`);
        continue;
      }
      
      console.log(`✅ Order found: ${order.orderNumber}`);
      console.log(`   Practice: ${order.practice?.name || 'N/A'}`);
      console.log(`   User: ${order.user?.email || 'N/A'}`);
      console.log(`   Files count: ${order.files?.length || 0}`);
      
      // Check files in order_files table
      const files = await prisma.orderFiles.findMany({
        where: { orderId: orderId },
        select: {
          id: true,
          fileName: true,
          fileType: true,
          fileSize: true,
          uploadedBy: true,
          createdAt: true,
          fileData: true
        }
      });
      
      console.log(`   Files in order_files table: ${files.length}`);
      files.forEach((file, index) => {
        console.log(`     ${index + 1}. ${file.fileName} (${file.fileSize} bytes, ${file.fileType})`);
        console.log(`        File data exists: ${file.fileData ? 'Yes' : 'No'}`);
        console.log(`        File data length: ${file.fileData ? file.fileData.length : 0}`);
      });
    }
    
    // Check all orders with files
    console.log('\n🔍 Checking all orders with files...');
    const allOrdersWithFiles = await prisma.orders.findMany({
      where: {
        files: {
          some: {}
        }
      },
      include: {
        files: true
      },
      take: 5
    });
    
    console.log(`Found ${allOrdersWithFiles.length} orders with files`);
    allOrdersWithFiles.forEach(order => {
      console.log(`  Order ${order.orderNumber}: ${order.files.length} files`);
    });
    
  } catch (error) {
    console.error('❌ Error testing order files:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOrderFiles();
