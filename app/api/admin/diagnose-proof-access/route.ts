import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/lib/session-manager";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // Only allow admin users to access this diagnostic endpoint
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getCurrentUser();
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const targetEmail = 'donnam@masscomminc.com';
    const targetOrderNumber = 'O-1758821301148';

    console.log('🔍 DETAILED PROOF ACCESS DIAGNOSTIC');
    console.log('===================================\n');

    // 1. Check the specific user with detailed logging
    console.log('1️⃣ CHECKING USER:', targetEmail);
    
    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: { 
        practice: true,
        orders: {
          include: { 
            practice: true,
            proofs: true
          }
        }
      }
    });

    if (!targetUser) {
      return NextResponse.json({ 
        error: "User not found",
        targetEmail,
        message: `User ${targetEmail} not found in database`
      }, { status: 404 });
    }

    console.log(`✅ User found: ${targetUser.name || 'No name'} (${targetUser.email})`);
    console.log(`   ID: ${targetUser.id}`);
    console.log(`   Clerk ID: ${targetUser.clerkId || 'None'}`);
    console.log(`   Role: ${targetUser.role}`);
    console.log(`   Practice ID: ${targetUser.practiceId || 'None'}`);
    console.log(`   Practice Name: ${targetUser.practice?.name || 'None'}`);
    console.log(`   Total Orders: ${targetUser.orders.length}`);

    // 2. Check the specific order with detailed logging
    console.log('2️⃣ CHECKING ORDER:', targetOrderNumber);
    
    const order = await prisma.orders.findUnique({
      where: { orderNumber: targetOrderNumber },
      include: {
        user: true,
        practice: true,
        proofs: {
          orderBy: { proofRound: 'desc' }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ 
        error: "Order not found",
        targetOrderNumber,
        message: `Order ${targetOrderNumber} not found in database`
      }, { status: 404 });
    }

    console.log(`✅ Order found: ${order.orderNumber}`);
    console.log(`   ID: ${order.id}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   User ID: ${order.userId}`);
    console.log(`   User Email: ${order.user?.email || 'None'}`);
    console.log(`   Practice ID: ${order.practiceId}`);
    console.log(`   Practice Name: ${order.practice?.name || 'None'}`);
    console.log(`   Proofs Count: ${order.proofs.length}`);

    // 3. Detailed ownership and permission analysis
    const ownershipCheck = {
      userOwnsOrder: order.userId === targetUser.id,
      orderBelongsToUserPractice: order.practiceId === targetUser.practiceId,
      userHasClerkId: !!targetUser.clerkId,
      getCurrentUserWouldFindUser: !!targetUser.clerkId,
      userIsAdmin: targetUser.role === 'ADMIN',
      orderUserMatchesTargetUser: order.userId === targetUser.id
    };

    console.log('3️⃣ DETAILED OWNERSHIP ANALYSIS:');
    console.log(`   Target User ID: ${targetUser.id}`);
    console.log(`   Order User ID: ${order.userId}`);
    console.log(`   User owns order: ${ownershipCheck.userOwnsOrder}`);
    console.log(`   Order belongs to user's practice: ${ownershipCheck.orderBelongsToUserPractice}`);
    console.log(`   User has Clerk ID: ${ownershipCheck.userHasClerkId}`);
    console.log(`   User is admin: ${ownershipCheck.userIsAdmin}`);
    console.log(`   getCurrentUser would find user: ${ownershipCheck.getCurrentUserWouldFindUser}`);

    // 4. Detailed proof analysis
    console.log('4️⃣ DETAILED PROOFS ANALYSIS:');
    if (order.proofs.length > 0) {
      order.proofs.forEach((proof, index) => {
        console.log(`   Proof ${index + 1}:`);
        console.log(`     ID: ${proof.id}`);
        console.log(`     Round: ${proof.proofRound}`);
        console.log(`     Status: ${proof.status}`);
        console.log(`     File Name: ${proof.fileName || 'None'}`);
        console.log(`     File Type: ${proof.fileType || 'None'}`);
        console.log(`     File Size: ${proof.fileSize || 'None'}`);
        console.log(`     Uploaded By: ${proof.uploadedBy}`);
        console.log(`     Uploaded At: ${proof.uploadedAt}`);
        console.log(`     Responded At: ${proof.respondedAt || 'Not responded'}`);
        console.log(`     User Feedback: ${proof.userFeedback || 'None'}`);
      });
    } else {
      console.log('   No proofs found for this order');
    }

    // 5. Test getCurrentUser simulation
    console.log('5️⃣ getCurrentUser SIMULATION:');
    let getCurrentUserResult = null;
    if (targetUser.clerkId) {
      try {
        const simulatedUser = await prisma.user.findUnique({
          where: { clerkId: targetUser.clerkId },
          include: { practice: true }
        });
        getCurrentUserResult = simulatedUser ? {
          id: simulatedUser.id,
          email: simulatedUser.email,
          name: simulatedUser.name,
          role: simulatedUser.role,
          practiceId: simulatedUser.practiceId,
          practiceName: simulatedUser.practice?.name,
          clerkId: simulatedUser.clerkId
        } : null;
        console.log('   getCurrentUser simulation result:', getCurrentUserResult);
      } catch (error) {
        console.log('   getCurrentUser simulation error:', error.message);
      }
    } else {
      console.log('   Cannot simulate getCurrentUser - user has no Clerk ID');
    }

    // 6. Authorization logic simulation
    console.log('6️⃣ AUTHORIZATION LOGIC SIMULATION:');
    const authChecks = {
      hasClerkId: !!targetUser.clerkId,
      getCurrentUserWorks: !!getCurrentUserResult,
      userOwnsOrder: order.userId === targetUser.id,
      userIsAdmin: targetUser.role === 'ADMIN',
      wouldPassAuth: (order.userId === targetUser.id) || (targetUser.role === 'ADMIN')
    };
    
    console.log('   Authorization checks:');
    console.log(`     Has Clerk ID: ${authChecks.hasClerkId}`);
    console.log(`     getCurrentUser works: ${authChecks.getCurrentUserWorks}`);
    console.log(`     User owns order: ${authChecks.userOwnsOrder}`);
    console.log(`     User is admin: ${authChecks.userIsAdmin}`);
    console.log(`     Would pass authorization: ${authChecks.wouldPassAuth}`);

    // 7. Check all users with similar emails
    console.log('7️⃣ SIMILAR USERS CHECK:');
    const similarUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'masscomminc.com'
        }
      },
      include: { practice: true }
    });

    console.log(`   Found ${similarUsers.length} users with masscomminc.com email:`);
    similarUsers.forEach((u, index) => {
      console.log(`     ${index + 1}. ${u.email} (${u.name || 'No name'})`);
      console.log(`        ID: ${u.id}`);
      console.log(`        Clerk ID: ${u.clerkId || 'MISSING'}`);
      console.log(`        Role: ${u.role}`);
      console.log(`        Practice: ${u.practice?.name || 'None'}`);
    });

    // 8. Check if there are any orders with the same order number but different user
    console.log('8️⃣ ORDER DUPLICATE CHECK:');
    const allOrdersWithSameNumber = await prisma.orders.findMany({
      where: { orderNumber: targetOrderNumber },
      include: { user: true, practice: true }
    });

    console.log(`   Found ${allOrdersWithSameNumber.length} orders with number ${targetOrderNumber}:`);
    allOrdersWithSameNumber.forEach((o, index) => {
      console.log(`     ${index + 1}. Order ID: ${o.id}`);
      console.log(`        User ID: ${o.userId}`);
      console.log(`        User Email: ${o.user?.email || 'None'}`);
      console.log(`        Practice ID: ${o.practiceId}`);
      console.log(`        Practice Name: ${o.practice?.name || 'None'}`);
      console.log(`        Status: ${o.status}`);
    });

    // 9. Final diagnosis and recommendations
    console.log('9️⃣ FINAL DIAGNOSIS:');
    const issues = [];
    
    if (!targetUser.clerkId) {
      issues.push('CRITICAL: User has no Clerk ID - getCurrentUser will fail');
    }
    
    if (!ownershipCheck.userOwnsOrder) {
      issues.push('CRITICAL: User does not own the order');
    }
    
    if (!ownershipCheck.orderBelongsToUserPractice) {
      issues.push('WARNING: Order does not belong to user\'s practice');
    }
    
    if (order.proofs.length === 0) {
      issues.push('CRITICAL: No proofs found for this order');
    }
    
    if (!targetUser.name) {
      issues.push('WARNING: User name field is empty');
    }

    console.log(`   Issues identified: ${issues.length}`);
    issues.forEach((issue, index) => {
      console.log(`     ${index + 1}. ${issue}`);
    });

    return NextResponse.json({
      success: true,
      targetEmail,
      targetOrderNumber,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        clerkId: targetUser.clerkId,
        role: targetUser.role,
        practiceId: targetUser.practiceId,
        practiceName: targetUser.practice?.name,
        ordersCount: targetUser.orders.length
      },
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        userId: order.userId,
        userEmail: order.user?.email,
        practiceId: order.practiceId,
        practiceName: order.practice?.name,
        proofsCount: order.proofs.length
      },
      ownershipCheck,
      proofs: order.proofs.map(proof => ({
        id: proof.id,
        proofRound: proof.proofRound,
        status: proof.status,
        fileName: proof.fileName,
        uploadedAt: proof.uploadedAt,
        uploadedBy: proof.uploadedBy
      })),
      getCurrentUserResult,
      authChecks,
      similarUsers: similarUsers.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        clerkId: u.clerkId,
        role: u.role,
        practiceName: u.practice?.name
      })),
      allOrdersWithSameNumber: allOrdersWithSameNumber.map(o => ({
        id: o.id,
        userId: o.userId,
        userEmail: o.user?.email,
        practiceId: o.practiceId,
        practiceName: o.practice?.name,
        status: o.status
      })),
      issues,
      diagnosis: {
        userExists: !!targetUser,
        orderExists: !!order,
        userHasClerkId: !!targetUser.clerkId,
        userOwnsOrder: ownershipCheck.userOwnsOrder,
        orderBelongsToUserPractice: ownershipCheck.orderBelongsToUserPractice,
        getCurrentUserWouldWork: !!getCurrentUserResult,
        nameFieldIssue: !targetUser.name ? "User name is null/empty in database" : "Name field has data",
        proofAccessWillWork: authChecks.wouldPassAuth && order.proofs.length > 0,
        rootCause: issues.length > 0 ? issues[0] : "No issues identified"
      }
    });

  } catch (error) {
    console.error('❌ Error in detailed diagnostic endpoint:', error);
    return NextResponse.json({ 
      error: "Diagnostic failed", 
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
