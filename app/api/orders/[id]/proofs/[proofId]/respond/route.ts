import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { EmailService } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; proofId: string } }
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
      include: { practice: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if user has access to this order
    if (order.practiceId !== user.practiceId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get the proof
    const proof = await prisma.proof.findUnique({
      where: { id: params.proofId },
      include: { order: true }
    });

    if (!proof) {
      return NextResponse.json({ error: "Proof not found" }, { status: 404 });
    }

    // Verify this proof belongs to the order
    if (proof.orderId !== params.id) {
      return NextResponse.json({ error: "Proof does not belong to this order" }, { status: 400 });
    }

    // Check if proof is still pending
    if (proof.status !== 'PENDING') {
      return NextResponse.json({ error: "Proof has already been responded to" }, { status: 400 });
    }

    const body = await request.json();
    const { action, feedback } = body;

    if (!action || !['APPROVED', 'CHANGES_REQUESTED'].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Must be 'APPROVED' or 'CHANGES_REQUESTED'" }, { status: 400 });
    }

    if (action === 'CHANGES_REQUESTED' && !feedback) {
      return NextResponse.json({ error: "Feedback is required when requesting changes" }, { status: 400 });
    }

    // Update proof status and add feedback
    const updatedProof = await prisma.proof.update({
      where: { id: params.proofId },
      data: {
        status: action,
        userFeedback: feedback || null,
        respondedAt: new Date()
      }
    });

    // Update order status based on action
    let newOrderStatus: string;
    if (action === 'APPROVED') {
      newOrderStatus = 'approved';
    } else {
      // Check if this is the 3rd or more revision
      const totalProofs = await prisma.proof.count({
        where: { orderId: params.id }
      });
      
      if (totalProofs >= 3) {
        newOrderStatus = 'escalated';
      } else {
        newOrderStatus = 'changes-requested';
      }
    }

    await prisma.orders.update({
      where: { id: params.id },
      data: { 
        status: newOrderStatus,
        updatedAt: new Date()
      }
    });

    // Create status history entry
    await prisma.orderStatusHistory.create({
      data: {
        orderId: params.id,
        fromStatus: `waiting-approval-rev${proof.proofRound}`,
        toStatus: newOrderStatus,
        changedBy: user.id,
        changedByRole: user.role,
        comments: action === 'APPROVED' 
          ? `Proof #${proof.proofRound} approved by customer`
          : `Changes requested on Proof #${proof.proofRound}: ${feedback}`,
        metadata: { 
          proofId: proof.id, 
          proofRound: proof.proofRound,
          action,
          feedback
        }
      }
    });

    // Create email notification record and send email
    try {
      const emailService = new EmailService();
      await emailService.sendProofResponseEmail(
        user.email || '',
        order.orderNumber,
        action,
        feedback
      );

      await prisma.emailNotifications.create({
        data: {
          orderId: params.id,
          userId: user.id,
          practiceId: order.practiceId,
          recipientEmail: user.email || '',
          emailType: 'proof_response',
          subject: `Proof ${action.toLowerCase()} - Order #${order.orderNumber}`,
          content: `Your response to Proof #${proof.proofRound} has been recorded. ${action === 'APPROVED' ? 'Your order will now proceed to production.' : 'Our team will review your feedback and upload a revised proof.'}`,
          status: 'sent',
          metadata: JSON.stringify({ 
            proofId: proof.id, 
            action, 
            feedback,
            sentBy: 'system',
            sentAt: new Date().toISOString()
          })
        }
      });
    } catch (emailError: any) {
      console.error("Failed to send proof response email:", emailError);
      
      // Create failed email notification record
      await prisma.emailNotifications.create({
        data: {
          orderId: params.id,
          userId: user.id,
          practiceId: order.practiceId,
          recipientEmail: user.email || '',
          emailType: 'proof_response',
          subject: `Proof ${action.toLowerCase()} - Order #${order.orderNumber}`,
          content: `Your response to Proof #${proof.proofRound} has been recorded. ${action === 'APPROVED' ? 'Your order will now proceed to production.' : 'Our team will review your feedback and upload a revised proof.'}`,
          status: 'failed',
          errorMessage: emailError.message || 'Unknown error',
          metadata: JSON.stringify({ 
            proofId: proof.id, 
            action, 
            feedback,
            sentBy: 'system',
            attemptedAt: new Date().toISOString(),
            error: emailError.message
          })
        }
      });
    }

    console.log(`✅ Proof #${proof.proofRound} ${action.toLowerCase()} for order ${params.id}`);

    return NextResponse.json({ 
      success: true,
      proof: updatedProof,
      orderStatus: newOrderStatus,
      message: action === 'APPROVED' 
        ? 'Proof approved successfully! Your order will now proceed to production.'
        : 'Changes requested. Our team will review your feedback and upload a revised proof.'
    });
  } catch (error) {
    console.error("Error responding to proof:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
