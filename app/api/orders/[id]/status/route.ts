import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { StatusManager, type OrderStatus } from "@/lib/status-management";
import { EmailService } from "@/lib/email";

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
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const orderId = params.id;
    const { newStatus, comments } = await req.json();

    // Get the order with current status
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: { 
        user: true, 
        practice: true,
        statusHistory: {
          include: { user: true },
          orderBy: { createdAt: 'desc' },
          take: 1
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

    const currentStatus = order.status as OrderStatus;
    const userRole = user.role as 'ADMIN' | 'USER';

    // Validate the status transition
    const validation = StatusManager.isValidTransition(currentStatus, newStatus, userRole);
    
    if (!validation.valid) {
      return NextResponse.json({ 
        error: validation.error || "Invalid status transition" 
      }, { status: 400 });
    }

    const transition = validation.transition!;

    // Check if comments are required but not provided
    if (transition.requiresComment && (!comments || comments.trim() === '')) {
      return NextResponse.json({ 
        error: "Comments are required for this status transition" 
      }, { status: 400 });
    }

    // Perform the status change within a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the order status
      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: { 
          status: newStatus,
          updatedAt: new Date()
        },
        include: { 
          user: true, 
          practice: true,
          statusHistory: {
            include: { user: true },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      // Create status history entry
      const statusHistoryEntry = await tx.orderStatusHistory.create({
        data: {
          orderId: orderId,
          fromStatus: currentStatus,
          toStatus: newStatus,
          changedBy: user.id,
          changedByRole: userRole,
          comments: comments || null,
          metadata: {
            transitionDescription: transition.description,
            autoNotify: transition.autoNotify
          }
        },
        include: { user: true }
      });

      // Send specific email notifications based on status change
      if (transition.autoNotify) {
        try {
          const recipientEmail = order.practice?.email || order.user?.email;
          
          if (recipientEmail) {
            const emailService = new EmailService();
            let emailSent = false;
            let emailType = 'status_change';
            let subject = `Order Status Updated - ${order.orderNumber}`;
            let content = `Your order ${order.orderNumber} status has been updated from "${currentStatus}" to "${newStatus}". ${comments ? `Comments: ${comments}` : ''}`;

            // Send specific emails based on the new status
            switch (newStatus) {
              case 'submitted':
                await emailService.sendOrderConfirmationEmail(recipientEmail, {
                  orderNumber: order.orderNumber,
                  practiceName: order.practice?.name || 'Your Practice',
                  subject: order.subject,
                  templateType: order.templateType,
                  cost: order.cost,
                  estimatedRecipients: order.actualRecipients
                });
                emailSent = true;
                emailType = 'order_confirmation';
                subject = `Order Confirmation - ${order.orderNumber} | PatientLetterHub`;
                content = `Order confirmation email sent for ${order.orderNumber}`;
                break;

              case 'in-production':
                await emailService.sendOrderInProductionEmail(recipientEmail, {
                  orderNumber: order.orderNumber,
                  practiceName: order.practice?.name || 'Your Practice',
                  estimatedCompletionDate: order.productionEndDate ? new Date(order.productionEndDate).toLocaleDateString() : undefined
                });
                emailSent = true;
                emailType = 'order_in_production';
                subject = `Order In Production - ${order.orderNumber} | PatientLetterHub`;
                content = `Order in production notification sent for ${order.orderNumber}`;
                break;

              case 'waiting-approval':
              case 'waiting-approval-rev1':
              case 'waiting-approval-rev2':
              case 'waiting-approval-rev3':
                // Get the latest proof for this order
                console.log('🔍 ORDER STATUS API - Getting latest proof for order:', orderId);
                const latestProof = await tx.proof.findFirst({
                  where: { orderId: orderId },
                  orderBy: { createdAt: 'desc' }
                });
                
                console.log('🔍 ORDER STATUS API - Latest proof query result:');
                console.log('   Proof found:', !!latestProof);
                if (latestProof) {
                  console.log('   Proof details:', {
                    id: latestProof.id,
                    orderId: latestProof.orderId,
                    proofRound: latestProof.proofRound,
                    status: latestProof.status,
                    fileName: latestProof.fileName
                  });
                } else {
                  console.log('   No proof found for order:', orderId);
                }
                
                if (latestProof) {
                  const revisionNumber = newStatus.includes('rev') ? parseInt(newStatus.split('rev')[1]) : undefined;
                  console.log('🔍 ORDER STATUS API - Sending proof ready email:');
                  console.log('   Recipient email:', recipientEmail);
                  console.log('   Order number:', order.orderNumber);
                  console.log('   Practice name:', order.practice?.name);
                  console.log('   Proof ID:', latestProof.id);
                  console.log('   Order ID:', order.id);
                  console.log('   Revision number:', revisionNumber);
                  
                  await emailService.sendProofReadyEmail(recipientEmail, {
                    orderNumber: order.orderNumber,
                    practiceName: order.practice?.name || 'Your Practice',
                    proofId: latestProof.id,
                    orderId: order.id,
                    revisionNumber: revisionNumber
                  });
                  emailSent = true;
                  emailType = 'proof_ready';
                  subject = `Proof Ready for Review${revisionNumber ? ` (Revision ${revisionNumber})` : ''} - ${order.orderNumber} | PatientLetterHub`;
                  content = `Proof ready notification sent for ${order.orderNumber}`;
                  
                  console.log('✅ ORDER STATUS API - Proof ready email sent successfully');
                } else {
                  console.log('❌ ORDER STATUS API - Cannot send proof ready email - no proof found');
                }
                break;

              case 'approved':
                // Determine revision number from previous status
                const revisionNumber = currentStatus.includes('rev') ? parseInt(currentStatus.split('rev')[1]) : undefined;
                await emailService.sendProofApprovedEmail(recipientEmail, {
                  orderNumber: order.orderNumber,
                  practiceName: order.practice?.name || 'Your Practice',
                  revisionNumber: revisionNumber
                });
                emailSent = true;
                emailType = 'proof_approved';
                subject = `Proof Approved${revisionNumber ? ` (Revision ${revisionNumber})` : ''} - ${order.orderNumber} | PatientLetterHub`;
                content = `Proof approved notification sent for ${order.orderNumber}`;
                break;

              case 'production-complete':
                await emailService.sendOrderCompletedEmail(recipientEmail, {
                  orderNumber: order.orderNumber,
                  practiceName: order.practice?.name || 'Your Practice',
                  completionDate: new Date().toLocaleDateString(),
                  trackingNumber: undefined // Will be added when shipped
                });
                emailSent = true;
                emailType = 'order_completed';
                subject = `Order Completed - ${order.orderNumber} | PatientLetterHub`;
                content = `Order completed notification sent for ${order.orderNumber}`;
                break;

              case 'shipped':
                await emailService.sendOrderMailedEmail(recipientEmail, {
                  orderNumber: order.orderNumber,
                  practiceName: order.practice?.name || 'Your Practice',
                  mailingDate: new Date().toLocaleDateString(),
                  trackingNumber: undefined, // Will be added when available
                  estimatedDelivery: undefined // Will be calculated
                });
                emailSent = true;
                emailType = 'order_mailed';
                subject = `Order Mailed - ${order.orderNumber} | PatientLetterHub`;
                content = `Order mailed notification sent for ${order.orderNumber}`;
                break;

              case 'completed':
                await emailService.sendOrderThankYouEmail(recipientEmail, {
                  orderNumber: order.orderNumber,
                  practiceName: order.practice?.name || 'Your Practice',
                  completionDate: new Date().toLocaleDateString()
                });
                emailSent = true;
                emailType = 'order_thank_you';
                subject = `Thank You - ${order.orderNumber} | PatientLetterHub`;
                content = `Order thank you email sent for ${order.orderNumber}`;
                break;

              default:
                // For other status changes, send a generic status update email
                await emailService.sendStatusUpdateEmail(
                  recipientEmail,
                  order.orderNumber,
                  currentStatus,
                  newStatus,
                  comments
                );
                emailSent = true;
                break;
            }

            // Create email notification record
            if (emailSent) {
              await tx.emailNotifications.create({
                data: {
                  orderId: orderId,
                  userId: order.userId,
                  practiceId: order.practiceId,
                  recipientEmail,
                  emailType,
                  subject,
                  content,
                  status: 'sent',
                  metadata: JSON.stringify({
                    sentBy: 'system',
                    sentAt: new Date().toISOString(),
                    transitionDescription: transition.description,
                    fromStatus: currentStatus,
                    toStatus: newStatus
                  })
                }
              });
            }
          }
        } catch (emailError: any) {
          console.error("Failed to send status change notification:", emailError);
          
          // Create failed email notification record
          await tx.emailNotifications.create({
            data: {
              orderId: orderId,
              userId: order.userId,
              practiceId: order.practiceId,
              recipientEmail: order.practice?.email || order.user?.email || 'unknown',
              emailType: 'status_change',
              subject: `Order Status Updated - ${order.orderNumber}`,
              content: `Your order ${order.orderNumber} status has been updated from "${currentStatus}" to "${newStatus}". ${comments ? `Comments: ${comments}` : ''}`,
              status: 'failed',
              errorMessage: emailError.message || 'Unknown error',
              metadata: JSON.stringify({
                sentBy: 'system',
                attemptedAt: new Date().toISOString(),
                error: emailError.message,
                fromStatus: currentStatus,
                toStatus: newStatus
              })
            }
          });
        }
      }

      return { updatedOrder, statusHistoryEntry };
    });

    return NextResponse.json({
      message: "Status updated successfully",
      order: result.updatedOrder,
      statusHistory: result.statusHistoryEntry
    });

  } catch (err) {
    console.error("Error updating order status:", err);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
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

    const orderId = params.id;

    // Get the order with status history
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: { 
        user: true, 
        practice: true,
        statusHistory: {
          include: { user: true },
          orderBy: { createdAt: 'desc' }
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

    const currentStatus = order.status as OrderStatus;
    const userRole = user.role as 'ADMIN' | 'USER';

    // Get available transitions for current user
    const availableTransitions = StatusManager.getAvailableTransitions(currentStatus, userRole);

    // Get status display info
    const statusInfo = StatusManager.getStatusDisplayInfo(currentStatus);

    return NextResponse.json({
      currentStatus,
      statusInfo,
      availableTransitions,
      statusHistory: order.statusHistory,
      isCustomerActionable: StatusManager.isCustomerActionable(currentStatus),
      isAdminActionable: StatusManager.isAdminActionable(currentStatus),
      requiresCustomerAction: StatusManager.requiresCustomerAction(currentStatus),
      requiresAdminAction: StatusManager.requiresAdminAction(currentStatus)
    });

  } catch (err) {
    console.error("Error fetching order status:", err);
    return NextResponse.json({ error: "Failed to fetch order status" }, { status: 500 });
  }
} 