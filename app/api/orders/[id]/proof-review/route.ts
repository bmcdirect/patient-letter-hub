import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/lib/session-manager";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 PROOF REVIEW API - DETAILED FLOW TRACE');
    console.log('==========================================');
    console.log('   Request URL:', req.url);
    console.log('   Order ID from params:', params.id);
    console.log('   Full URL:', req.url);
    
    const { searchParams } = new URL(req.url);
    const proofId = searchParams.get('proofId');
    console.log('   Proof ID from URL:', proofId);
    console.log('   All URL params:', Object.fromEntries(searchParams.entries()));
    
    const { userId } = await auth();
    
    if (!userId) {
      console.log('❌ PROOF REVIEW API - No Clerk user ID');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ PROOF REVIEW API - Clerk user ID:', userId);

    // Get the user from our database
    console.log('🔍 PROOF REVIEW API - Calling getCurrentUser()...');
    const user = await getCurrentUser();
    
    if (!user) {
      console.log('❌ PROOF REVIEW API - User not found in database');
      console.log('   This means getCurrentUser() returned null');
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log('✅ PROOF REVIEW API - User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      practiceId: user.practiceId,
      practiceName: user.practice?.name,
      clerkId: user.clerkId
    });

    const { id: orderId } = params;
    console.log('🔍 PROOF REVIEW API - Processing request:');
    console.log('   Order ID:', orderId);
    console.log('   Proof ID:', proofId);

    if (!proofId) {
      console.log('❌ PROOF REVIEW API - No proofId provided');
      return NextResponse.json({ error: "Proof ID is required" }, { status: 400 });
    }

    // Get the order with proof
    console.log('🔍 PROOF REVIEW API - Querying database for order...');
    console.log('   Query: orders.findUnique where id =', orderId);
    console.log('   Include: user, practice, proofs where id =', proofId);
    
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: { 
        user: true, 
        practice: true,
        proofs: {
          where: { id: proofId },
          orderBy: { proofRound: 'desc' }
        }
      }
    });

    console.log('🔍 PROOF REVIEW API - Database query result:');
    console.log('   Order found:', !!order);
    if (order) {
      console.log('   Order details:', {
        id: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        practiceId: order.practiceId,
        status: order.status,
        proofsCount: order.proofs.length
      });
      console.log('   Order proofs:', order.proofs.map(p => ({
        id: p.id,
        proofRound: p.proofRound,
        status: p.status,
        fileName: p.fileName
      })));
    } else {
      console.log('   Order not found in database');
    }

    if (!order) {
      console.log('❌ PROOF REVIEW API - Order not found');
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check permissions (user owns the order or is admin)
    console.log('🔍 PROOF REVIEW API - Authorization check:');
    console.log('   Order User ID:', order.userId);
    console.log('   Current User ID:', user.id);
    console.log('   User Role:', user.role);
    console.log('   User owns order:', order.userId === user.id);
    console.log('   User is admin:', user.role === "ADMIN");
    console.log('   Authorization will pass:', (order.userId === user.id) || (user.role === "ADMIN"));

    if (order.userId !== user.id && user.role !== "ADMIN") {
      console.log('❌ PROOF REVIEW API - Authorization failed');
      console.log('   User does not own order and is not admin');
      return NextResponse.json({ 
        error: "Unauthorized", 
        details: {
          orderUserId: order.userId,
          currentUserId: user.id,
          userRole: user.role,
          message: "User does not own this order and is not an admin"
        }
      }, { status: 403 });
    }

    console.log('✅ PROOF REVIEW API - Authorization passed');

    const proof = order.proofs[0];
    console.log('🔍 PROOF REVIEW API - Proof extraction:');
    console.log('   Proofs array length:', order.proofs.length);
    console.log('   First proof:', proof ? {
      id: proof.id,
      proofRound: proof.proofRound,
      status: proof.status,
      fileName: proof.fileName
    } : 'null');

    if (!proof) {
      console.log('❌ PROOF REVIEW API - Proof not found');
      console.log('   This means the proofId does not match any proof for this order');
      console.log('   Available proofs for this order:', order.proofs.map(p => p.id));
      return NextResponse.json({ 
        error: "Proof not found",
        details: {
          requestedProofId: proofId,
          availableProofIds: order.proofs.map(p => p.id),
          message: "The requested proof ID does not exist for this order"
        }
      }, { status: 404 });
    }

    console.log('✅ PROOF REVIEW API - Proof found:', {
      id: proof.id,
      proofRound: proof.proofRound,
      status: proof.status,
      fileName: proof.fileName,
      uploadedAt: proof.uploadedAt
    });

    // Return proof data (excluding sensitive file data)
    const responseData = {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        practiceName: order.practice?.name,
        status: order.status
      },
      proof: {
        id: proof.id,
        proofRound: proof.proofRound,
        fileName: proof.fileName,
        fileType: proof.fileType,
        fileSize: proof.fileSize,
        status: proof.status,
        uploadedAt: proof.uploadedAt
      }
    };

    console.log('✅ PROOF REVIEW API - Returning success response');
    console.log('   Response data:', responseData);

    return NextResponse.json(responseData);

  } catch (err) {
    console.error('❌ PROOF REVIEW API - Unexpected error:', err);
    console.error('   Error message:', err.message);
    console.error('   Error stack:', err.stack);
    return NextResponse.json({ 
      error: "Failed to fetch proof",
      details: err.message,
      stack: err.stack
    }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from our database
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id: orderId } = params;
    const { proofId, action, comments } = await req.json();

    if (!proofId || !action) {
      return NextResponse.json({ error: "Proof ID and action are required" }, { status: 400 });
    }

    if (!['approve', 'request_changes'].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Must be 'approve' or 'request_changes'" }, { status: 400 });
    }

    // Get the order
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: { 
        user: true, 
        practice: true,
        proofs: {
          where: { id: proofId }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check permissions (user owns the order or is admin)
    if (order.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const proof = order.proofs[0];
    if (!proof) {
      return NextResponse.json({ error: "Proof not found" }, { status: 404 });
    }

    // Update proof status
    const updatedProof = await prisma.proof.update({
      where: { id: proofId },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'CHANGES_REQUESTED',
        userFeedback: comments || null,
        respondedAt: new Date()
      }
    });

    // Update order status based on action
    let newOrderStatus: string;
    if (action === 'approve') {
      newOrderStatus = 'approved';
    } else {
      newOrderStatus = 'changes-requested';
    }

    const updatedOrder = await prisma.orders.update({
      where: { id: order.id },
      data: { 
        status: newOrderStatus,
        updatedAt: new Date()
      }
    });

    // Create status history entry
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: newOrderStatus,
        changedBy: user.id,
        changedByRole: user.role as 'ADMIN' | 'USER',
        comments: comments || null,
        metadata: {
          transitionDescription: `Customer ${action === 'approve' ? 'approved' : 'requested changes for'} proof`,
          autoNotify: true,
          proofId: proofId
        }
      }
    });

    return NextResponse.json({
      message: `Proof ${action === 'approve' ? 'approved' : 'changes requested'} successfully`,
      order: updatedOrder,
      proof: updatedProof
    });

  } catch (err) {
    console.error("Error updating proof:", err);
    return NextResponse.json({ error: "Failed to update proof" }, { status: 500 });
  }
}
