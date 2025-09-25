import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/lib/session-manager";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Proof Review API - Starting GET request');
    console.log('   Order ID:', params.id);
    console.log('   Proof ID:', req.url.includes('proofId=') ? new URL(req.url).searchParams.get('proofId') : 'Not provided');
    
    const { userId } = await auth();
    
    if (!userId) {
      console.log('❌ Proof Review API - No Clerk user ID');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ Proof Review API - Clerk user ID:', userId);

    // Get the user from our database
    const user = await getCurrentUser();
    
    if (!user) {
      console.log('❌ Proof Review API - User not found in database');
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log('✅ Proof Review API - User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      practiceId: user.practiceId,
      practiceName: user.practice?.name
    });

    const { id: orderId } = params;
    const { searchParams } = new URL(req.url);
    const proofId = searchParams.get('proofId');

    if (!proofId) {
      return NextResponse.json({ error: "Proof ID is required" }, { status: 400 });
    }

    // Get the order with proof
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

    // Return proof data (excluding sensitive file data)
    return NextResponse.json({
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
    });

  } catch (err) {
    console.error("Error fetching proof:", err);
    return NextResponse.json({ error: "Failed to fetch proof" }, { status: 500 });
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
