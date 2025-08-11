import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrderStatuses() {
  try {
    console.log('🔍 Checking order statuses in database...');
    
    const orders = await prisma.orders.findMany({
      select: {
        id: true,
        orderNumber: true,
        status: true,
        subject: true,
        practice: {
          select: {
            name: true
          }
        },
        user: {
          select: {
            email: true,
            role: true
          }
        },
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ Found ${orders.length} orders:`);
    orders.forEach(order => {
      console.log(`  - ${order.orderNumber} (${order.status}) - ${order.subject || 'No subject'} - Practice: ${order.practice?.name || 'Unknown'} - User: ${order.user?.email} (${order.user?.role})`);
    });

    // Group by status
    const statusGroups = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n🔍 Orders by status:');
    Object.entries(statusGroups).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count} orders`);
    });

    // Find approved orders
    const approvedOrders = orders.filter(o => o.status === 'approved');
    console.log(`\n🔍 Approved orders: ${approvedOrders.length}`);
    approvedOrders.forEach(order => {
      console.log(`  - ${order.orderNumber} - ${order.subject || 'No subject'} - Practice: ${order.practice?.name || 'Unknown'}`);
    });

  } catch (error) {
    console.error('❌ Error checking order statuses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrderStatuses();
