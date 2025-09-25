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

    console.log('🔍 CHECKING SPECIFIC USER AND ORDER');
    console.log('===================================\n');

    // 1. Check the specific user
    console.log('1️⃣ CHECKING USER:', targetEmail);
    
    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: { 
        practice: true,
        orders: {
          include: { practice: true }
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

    // 2. Check the specific order
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

    // 3. Check ownership and permissions
    const ownershipCheck = {
      userOwnsOrder: order.userId === targetUser.id,
      orderBelongsToUserPractice: order.practiceId === targetUser.practiceId,
      userHasClerkId: !!targetUser.clerkId,
      getCurrentUserWouldFindUser: !!targetUser.clerkId
    };

    console.log('3️⃣ OWNERSHIP CHECK:');
    console.log(`   User owns order: ${ownershipCheck.userOwnsOrder}`);
    console.log(`   Order belongs to user's practice: ${ownershipCheck.orderBelongsToUserPractice}`);
    console.log(`   User has Clerk ID: ${ownershipCheck.userHasClerkId}`);
    console.log(`   getCurrentUser would find user: ${ownershipCheck.getCurrentUserWouldFindUser}`);

    // 4. Check proofs
    const proofsInfo = order.proofs.map(proof => ({
      id: proof.id,
      proofRound: proof.proofRound,
      status: proof.status,
      fileName: proof.fileName,
      uploadedAt: proof.uploadedAt
    }));

    console.log(`4️⃣ PROOFS: ${order.proofs.length} found`);

    // 5. Check similar users
    const similarUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'masscomminc.com'
        }
      },
      include: { practice: true }
    });

    console.log(`5️⃣ SIMILAR USERS: ${similarUsers.length} found`);

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
      proofs: proofsInfo,
      similarUsers: similarUsers.map(u => ({
        email: u.email,
        name: u.name,
        clerkId: u.clerkId,
        practiceName: u.practice?.name
      })),
      diagnosis: {
        userExists: !!targetUser,
        orderExists: !!order,
        userHasClerkId: !!targetUser.clerkId,
        userOwnsOrder: ownershipCheck.userOwnsOrder,
        orderBelongsToUserPractice: ownershipCheck.orderBelongsToUserPractice,
        getCurrentUserWouldWork: !!targetUser.clerkId,
        possibleIssues: [
          !targetUser.clerkId ? "User has no Clerk ID - getCurrentUser will fail" : null,
          !ownershipCheck.userOwnsOrder ? "User doesn't own the order" : null,
          !ownershipCheck.orderBelongsToUserPractice ? "Order doesn't belong to user's practice" : null
        ].filter(Boolean)
      }
    });

  } catch (error) {
    console.error('❌ Error in diagnostic endpoint:', error);
    return NextResponse.json({ 
      error: "Diagnostic failed", 
      details: error.message 
    }, { status: 500 });
  }
}
