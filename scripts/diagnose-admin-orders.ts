import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnoseAdminOrders() {
  console.log('🔍 DIAGNOSING ADMIN DASHBOARD ORDER VISIBILITY ISSUE');
  console.log('====================================================\n');

  try {
    // 1. Check all users and their roles
    console.log('1️⃣ CHECKING USERS AND ROLES:');
    console.log('-----------------------------');
    const users = await prisma.user.findMany({
      include: { practice: true }
    });

    console.log(`Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name || 'No name'})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Practice: ${user.practice?.name || 'None'}`);
      console.log(`   Practice ID: ${user.practiceId || 'None'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

    // 2. Check all practices
    console.log('2️⃣ CHECKING PRACTICES:');
    console.log('----------------------');
    const practices = await prisma.practice.findMany({
      include: { 
        users: true,
        _count: {
          select: { orders: true }
        }
      }
    });

    console.log(`Found ${practices.length} practices:`);
    practices.forEach((practice, index) => {
      console.log(`${index + 1}. ${practice.name}`);
      console.log(`   ID: ${practice.id}`);
      console.log(`   Email: ${practice.email}`);
      console.log(`   Users: ${practice.users.length}`);
      console.log(`   Orders: ${practice._count.orders}`);
      console.log(`   Created: ${practice.createdAt}`);
      console.log('');
    });

    // 3. Check all orders
    console.log('3️⃣ CHECKING ALL ORDERS:');
    console.log('----------------------');
    const allOrders = await prisma.orders.findMany({
      include: {
        practice: true,
        user: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${allOrders.length} orders:`);
    allOrders.forEach((order, index) => {
      console.log(`${index + 1}. ${order.orderNumber}`);
      console.log(`   ID: ${order.id}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Subject: ${order.subject || 'No subject'}`);
      console.log(`   Practice: ${order.practice?.name || 'Unknown'}`);
      console.log(`   Practice ID: ${order.practiceId}`);
      console.log(`   User: ${order.user?.email || 'Unknown'}`);
      console.log(`   User ID: ${order.userId}`);
      console.log(`   Created: ${order.createdAt}`);
      console.log('');
    });

    // 4. Simulate /api/orders endpoint logic
    console.log('4️⃣ SIMULATING /api/orders ENDPOINT LOGIC:');
    console.log('------------------------------------------');
    
    // Find admin users
    const adminUsers = users.filter(u => u.role === 'ADMIN');
    console.log(`Found ${adminUsers.length} admin users:`);
    
    adminUsers.forEach((admin, index) => {
      console.log(`Admin ${index + 1}: ${admin.email}`);
      
      // Simulate the admin query from /api/orders
      const adminOrders = allOrders; // Admin sees all orders
      console.log(`   Would see ${adminOrders.length} orders (all orders)`);
      
      // Show first few orders
      adminOrders.slice(0, 3).forEach(order => {
        console.log(`     - ${order.orderNumber} (${order.status}) - ${order.practice?.name}`);
      });
      if (adminOrders.length > 3) {
        console.log(`     ... and ${adminOrders.length - 3} more`);
      }
      console.log('');
    });

    // 5. Simulate /api/admin/orders endpoint logic
    console.log('5️⃣ SIMULATING /api/admin/orders ENDPOINT LOGIC:');
    console.log('-----------------------------------------------');
    
    // This endpoint has NO authentication - it returns all orders
    const adminApiOrders = allOrders;
    console.log(`/api/admin/orders would return ${adminApiOrders.length} orders (NO AUTH CHECK!)`);
    
    adminApiOrders.slice(0, 5).forEach(order => {
      console.log(`   - ${order.orderNumber} (${order.status}) - ${order.practice?.name}`);
    });
    if (adminApiOrders.length > 5) {
      console.log(`   ... and ${adminApiOrders.length - 5} more`);
    }
    console.log('');

    // 6. Check for potential issues
    console.log('6️⃣ POTENTIAL ISSUES IDENTIFIED:');
    console.log('--------------------------------');
    
    let issuesFound = 0;
    
    // Check for orders without practice
    const ordersWithoutPractice = allOrders.filter(o => !o.practice);
    if (ordersWithoutPractice.length > 0) {
      console.log(`❌ ISSUE: ${ordersWithoutPractice.length} orders have no practice association:`);
      ordersWithoutPractice.forEach(order => {
        console.log(`   - ${order.orderNumber} (Practice ID: ${order.practiceId})`);
      });
      issuesFound++;
    }
    
    // Check for orders without user
    const ordersWithoutUser = allOrders.filter(o => !o.user);
    if (ordersWithoutUser.length > 0) {
      console.log(`❌ ISSUE: ${ordersWithoutUser.length} orders have no user association:`);
      ordersWithoutUser.forEach(order => {
        console.log(`   - ${order.orderNumber} (User ID: ${order.userId})`);
      });
      issuesFound++;
    }
    
    // Check for users without practice
    const usersWithoutPractice = users.filter(u => !u.practiceId && u.role !== 'ADMIN');
    if (usersWithoutPractice.length > 0) {
      console.log(`❌ ISSUE: ${usersWithoutPractice.length} users have no practice association:`);
      usersWithoutPractice.forEach(user => {
        console.log(`   - ${user.email} (Role: ${user.role})`);
      });
      issuesFound++;
    }
    
    // Check for admin users
    if (adminUsers.length === 0) {
      console.log(`❌ CRITICAL ISSUE: No admin users found!`);
      issuesFound++;
    }
    
    if (issuesFound === 0) {
      console.log('✅ No obvious data integrity issues found');
    }

    // 7. Recommendations
    console.log('\n7️⃣ RECOMMENDATIONS:');
    console.log('-------------------');
    console.log('1. SECURITY ISSUE: /api/admin/orders has NO authentication!');
    console.log('   - This endpoint should require admin authentication');
    console.log('   - Currently anyone can access all orders');
    console.log('');
    console.log('2. The admin dashboard calls /api/admin/orders (unsecured)');
    console.log('   - Should call /api/orders instead (which has auth)');
    console.log('   - Or fix /api/admin/orders to include authentication');
    console.log('');
    console.log('3. Test the actual endpoints:');
    console.log('   - Check if admin dashboard is calling the right endpoint');
    console.log('   - Verify authentication is working properly');
    console.log('   - Test with a real admin user session');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseAdminOrders();
