import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { auditLogger } from '@/lib/audit-service';
import { getAuditContext, getCurrentUserForAudit } from '@/lib/audit-context';
import { AuditAction, AuditResource } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // ✅ ADD: Get audit context at the start
  const auditContext = await getAuditContext(request);
  const user = await getCurrentUserForAudit();
  
  try {
    const { userId } = await auth();
    
    if (!userId) {
      // ✅ ADD: Log unauthorized admin proof upload attempt
      await auditLogger.logFailure(
        AuditAction.UPLOAD,
        AuditResource.PROOF,
        undefined,
        undefined,
        'Unauthorized admin proof upload attempt',
        'No authenticated user',
        auditContext.ipAddress,
        auditContext.userAgent
      );
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the user from our database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!dbUser) {
      // ✅ ADD: Log user not found
      await auditLogger.logFailure(
        AuditAction.UPLOAD,
        AuditResource.PROOF,
        userId,
        undefined,
        'Admin proof upload failed - user not found in database',
        'User not found',
        auditContext.ipAddress,
        auditContext.userAgent
      );
      return new NextResponse("User not found", { status: 404 });
    }

    // Check if user is admin
    if (dbUser.role !== "ADMIN") {
      // ✅ ADD: Log unauthorized admin access attempt
      await auditLogger.logFailure(
        AuditAction.UPLOAD,
        AuditResource.PROOF,
        dbUser.id,
        dbUser.email!,
        'Non-admin user attempted admin proof upload',
        'Forbidden - Admin access required',
        auditContext.ipAddress,
        auditContext.userAgent
      );
      return new NextResponse("Forbidden - Admin access required", { status: 403 });
    }

    const orderId = params.id;
    
    // Verify the order exists
    const order = await prisma.orders.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      // ✅ ADD: Log order not found
      await auditLogger.logFailure(
        AuditAction.UPLOAD,
        AuditResource.PROOF,
        dbUser.id,
        dbUser.email!,
        `Admin proof upload failed - order ${orderId} not found`,
        'Order not found',
        auditContext.ipAddress,
        auditContext.userAgent
      );
      return new NextResponse("Order not found", { status: 404 });
    }

    // Parse form data for file upload
    const formData = await request.formData();
    const proofFile = formData.get('proofFile') as File;
    const adminNotes = formData.get('adminNotes') as string || '';
    const escalationReason = formData.get('escalationReason') as string || '';

    if (!proofFile) {
      // ✅ ADD: Log missing proof file
      await auditLogger.logFailure(
        AuditAction.UPLOAD,
        AuditResource.PROOF,
        dbUser.id,
        dbUser.email!,
        `Admin proof upload failed - no file provided for order ${orderId}`,
        'Proof file is required',
        auditContext.ipAddress,
        auditContext.userAgent
      );
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

    // ✅ ADD: Log successful admin proof upload
    await auditLogger.logProofOperation(
      AuditAction.UPLOAD,
      newProof.id,
      orderId,
      dbUser.id,
      dbUser.email!,
      dbUser.role,
      order.practiceId,
      `Admin uploaded proof #${nextProofRound}: ${proofFile.name}`,
      auditContext.ipAddress,
      auditContext.userAgent
    );

    console.log(`✅ Admin proof uploaded: ${proofFile.name} for order ${orderId} (Proof #${nextProofRound})`);

    return NextResponse.json({ 
      message: `Proof #${nextProofRound} uploaded successfully${nextProofRound >= 3 ? ' - ESCALATION REQUIRED' : ''}`,
      proof: newProof,
      proofRound: nextProofRound,
      fileName: proofFile.name,
      needsEscalation: nextProofRound >= 3
    });
  } catch (error: any) {
    // ✅ ADD: Log proof upload error
    await auditLogger.logFailure(
      AuditAction.UPLOAD,
      AuditResource.PROOF,
      user?.id,
      user?.email || undefined,
      `Admin proof upload failed: ${error.message}`,
      error.message,
      auditContext.ipAddress,
      auditContext.userAgent
    );

    console.error("Error uploading proof:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}