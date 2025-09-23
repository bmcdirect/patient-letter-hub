import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the user from our database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Check if user is admin
    if (user.role !== "ADMIN") {
      return new NextResponse("Forbidden - Admin access required", { status: 403 });
    }

    const orderId = params.id;
    
    // Verify the order exists
    const order = await prisma.orders.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // Parse form data for file upload
    const formData = await request.formData();
    const proofFile = formData.get('proofFile') as File;
    const adminNotes = formData.get('adminNotes') as string || '';
    const escalationReason = formData.get('escalationReason') as string || '';

    if (!proofFile) {
      return new NextResponse("Proof file is required", { status: 400 });
    }

    // Get current proof count for this order
    const existingProofs = await prisma.proof.findMany({
      where: { orderId: orderId },
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

    // Convert file to buffer for database storage
    const bytes = await proofFile.arrayBuffer();
    const fileBuffer = Buffer.from(bytes);

    // Create new Proof record with PostgreSQL storage
    const newProof = await prisma.proof.create({
      data: {
        orderId: orderId,
        proofRound: nextProofRound,
        fileName: proofFile.name,
        fileType: proofFile.type || 'application/octet-stream',
        fileSize: proofFile.size,
        fileData: fileBuffer,
        status: 'PENDING',
        adminNotes,
        uploadedBy: user.id,
        escalationReason: nextProofRound >= 3 ? escalationReason || 'Automatic escalation after 3+ rounds' : null
      }
    });

    // Update order status to indicate proof is ready
    await prisma.orders.update({
      where: { id: orderId },
      data: { 
        status: `waiting-approval-rev${nextProofRound}`,
        updatedAt: new Date()
      }
    });

    // Create status history entry
    await prisma.orderStatusHistory.create({
      data: {
        orderId: orderId,
        fromStatus: existingProofs.length > 0 ? `waiting-approval-rev${existingProofs[0].proofRound}` : 'draft',
        toStatus: `waiting-approval-rev${nextProofRound}`,
        changedBy: user.id,
        changedByRole: user.role,
        comments: `Proof #${nextProofRound} uploaded${escalationReason ? ` - Escalation: ${escalationReason}` : ''}`,
        metadata: { proofId: newProof.id, proofRound: nextProofRound }
      }
    });

    console.log(`✅ Admin proof uploaded: ${proofFile.name} for order ${orderId} (Proof #${nextProofRound})`);

    return NextResponse.json({ 
      message: `Proof #${nextProofRound} uploaded successfully${nextProofRound >= 3 ? ' - ESCALATION REQUIRED' : ''}`,
      proof: newProof,
      proofRound: nextProofRound,
      fileName: proofFile.name,
      needsEscalation: nextProofRound >= 3
    });
  } catch (error) {
    console.error("Error uploading proof:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}