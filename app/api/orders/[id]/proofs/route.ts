import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from our database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the order to verify user has access
    const order = await prisma.orders.findUnique({
      where: { id: params.id },
      include: { 
        practice: true,
        proofs: {
          include: {
            uploader: true,
            approval: true
          },
          orderBy: { proofRound: 'desc' }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if user has access to this order
    if (user.role !== 'ADMIN' && order.practiceId !== user.practiceId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    console.log(`🔍 Proofs API - Fetched ${order.proofs.length} proofs for order ${params.id}`);

    return NextResponse.json({ 
      proofs: order.proofs,
      currentProofRound: order.proofs.length > 0 ? Math.max(...order.proofs.map(p => p.proofRound)) : 0,
      needsEscalation: order.proofs.length >= 3 && order.proofs.some(p => p.status === 'PENDING')
    });
  } catch (error) {
    console.error("Error fetching proofs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from our database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { action, proofRound, fileUrl, filePath, adminNotes, escalationReason } = body;

    // Get current proof count for this order
    const existingProofs = await prisma.proof.findMany({
      where: { orderId: params.id },
      orderBy: { proofRound: 'desc' }
    });

    const nextProofRound = existingProofs.length > 0 ? Math.max(...existingProofs.map(p => p.proofRound)) + 1 : 1;

    // Check for escalation threshold
    if (nextProofRound > 3) {
      return NextResponse.json({ 
        error: "Maximum proof rounds exceeded. Order requires manual escalation.",
        needsEscalation: true,
        currentRound: nextProofRound
      }, { status: 400 });
    }

    // Create new proof
    const newProof = await prisma.proof.create({
      data: {
        orderId: params.id,
        proofRound: nextProofRound,
        fileUrl,
        filePath,
        status: 'PENDING',
        adminNotes,
        uploadedBy: user.id,
        escalationReason: nextProofRound >= 3 ? escalationReason || 'Automatic escalation after 3+ rounds' : null
      }
    });

    // Update order status
    await prisma.orders.update({
      where: { id: params.id },
      data: { 
        status: `waiting-approval-rev${nextProofRound}`,
        updatedAt: new Date()
      }
    });

    // Create status history entry
    await prisma.orderStatusHistory.create({
      data: {
        orderId: params.id,
        fromStatus: existingProofs.length > 0 ? `waiting-approval-rev${existingProofs[0].proofRound}` : 'draft',
        toStatus: `waiting-approval-rev${nextProofRound}`,
        changedBy: user.id,
        changedByRole: user.role,
        comments: `Proof #${nextProofRound} uploaded${escalationReason ? ` - Escalation: ${escalationReason}` : ''}`,
        metadata: { proofId: newProof.id, proofRound: nextProofRound }
      }
    });

    console.log(`✅ Proof #${nextProofRound} created for order ${params.id}`);

    return NextResponse.json({ 
      success: true,
      proof: newProof,
      proofRound: nextProofRound,
      message: `Proof #${nextProofRound} uploaded successfully${nextProofRound >= 3 ? ' - ESCALATION REQUIRED' : ''}`
    });
  } catch (error) {
    console.error("Error creating proof:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 