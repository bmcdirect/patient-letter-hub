const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testOrderUpdate() {
  try {
    console.log('🔍 Testing order update functionality...');
    
    // Find an existing order to test with
    const existingOrder = await prisma.orders.findFirst({
      where: {
        status: 'pending'
      }
    });
    
    if (!existingOrder) {
      console.log('❌ No pending orders found to test with');
      return;
    }
    
    console.log(`✅ Found order to test: ${existingOrder.orderNumber} (${existingOrder.id})`);
    
    // Test updating the order with new fields
    const updateData = {
      subject: 'Updated Test Subject',
      purchaseOrder: 'PO-12345',
      costCenter: 'CC-001',
      actualRecipients: 150,
      dataCleansing: true,
      ncoaUpdate: true,
      firstClassPostage: false,
      notes: 'Test update notes',
      cost: 250.50
    };
    
    console.log('🔍 Updating order with data:', updateData);
    
    const updatedOrder = await prisma.orders.update({
      where: { id: existingOrder.id },
      data: updateData
    });
    
    console.log('✅ Order updated successfully!');
    console.log('Updated order data:', {
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      subject: updatedOrder.subject,
      purchaseOrder: updatedOrder.purchaseOrder,
      costCenter: updatedOrder.costCenter,
      actualRecipients: updatedOrder.actualRecipients,
      dataCleansing: updatedOrder.dataCleansing,
      ncoaUpdate: updatedOrder.ncoaUpdate,
      firstClassPostage: updatedOrder.firstClassPostage,
      notes: updatedOrder.notes,
      cost: updatedOrder.cost
    });
    
  } catch (error) {
    console.error('❌ Error testing order update:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOrderUpdate();
