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
    if (user.role !== 'ADMIN') {
      return new NextResponse("Admin access required", { status: 403 });
    }

    const body = await request.json();
    const { action, escalationNotes, resolution, contactCustomer } = body;

    if (!action || !['RESOLVE', 'CONTACT_CUSTOMER', 'ESCALATE_TO_MANAGER'].includes(action)) {
      return new NextResponse("Invalid action. Must be 'RESOLVE', 'CONTACT_CUSTOMER', or 'ESCALATE_TO_MANAGER'", { status: 400 });
    }

    // Get the order and its proofs
    const order = await prisma.orders.findUnique({
      where: { id: params.id },
      include: { 
        proofs: {
          orderBy: { proofRound: 'desc' }
        },
        practice: true,
        user: true
      }
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // Check if order is actually escalated
    if (order.status !== 'escalated') {
      return new NextResponse("Order is not in escalated status", { status: 400 });
    }

    let newOrderStatus: string;
    let statusComment: string;

    switch (action) {
      case 'RESOLVE':
        newOrderStatus = 'draft';
        statusComment = `Escalation resolved by admin: ${escalationNotes || 'No additional notes'}`;
        break;
      case 'CONTACT_CUSTOMER':
        newOrderStatus = 'escalated';
        statusComment = `Customer contacted regarding escalation: ${escalationNotes || 'No additional notes'}`;
        break;
      case 'ESCALATE_TO_MANAGER':
        newOrderStatus = 'escalated';
        statusComment = `Escalated to management: ${escalationNotes || 'No additional notes'}`;
        break;
      default:
        newOrderStatus = order.status;
        statusComment = '';
    }

    // Update order status
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
        fromStatus: 'escalated',
        toStatus: newOrderStatus,
        changedBy: user.id,
        changedByRole: user.role,
        comments: statusComment,
        metadata: { 
          action,
          escalationNotes,
          resolution,
          contactCustomer,
          escalatedBy: user.id
        }
      }
    });

    // Create email notification for escalation handling
    await prisma.emailNotifications.create({
      data: {
        orderId: params.id,
        userId: user.id,
        practiceId: order.practiceId,
        recipientEmail: user.email || '',
        emailType: 'escalation_handled',
        subject: `Escalation handled - Order #${order.orderNumber}`,
        content: `Escalation for Order #${order.orderNumber} has been handled by admin ${user.name}. Action: ${action}. Notes: ${escalationNotes || 'None'}`,
        metadata: JSON.stringify({ 
          action, 
          escalationNotes, 
          resolution, 
          contactCustomer,
          orderNumber: order.orderNumber,
          practiceName: order.practice?.name
        })
      }
    });

    // If customer contact is requested, create additional notification
    if (contactCustomer && order.user?.email) {
      await prisma.emailNotifications.create({
        data: {
          orderId: params.id,
          userId: order.userId,
          practiceId: order.practiceId,
          recipientEmail: order.user.email,
          emailType: 'escalation_customer_contact',
          subject: `Important: Order #${order.orderNumber} requires attention`,
          content: `Your order #${order.orderNumber} has been escalated due to multiple proof revisions. Our team will contact you directly to resolve this situation. Please expect a call or email from our customer service team.`,
          metadata: JSON.stringify({ 
            orderNumber: order.orderNumber,
            escalationReason: 'Multiple proof revisions',
            adminNotes: escalationNotes
          })
        }
      });
    }

    console.log(`✅ Escalation handled for order ${params.id} by admin ${user.id}`);

    return NextResponse.json({ 
      success: true,
      orderStatus: newOrderStatus,
      message: `Escalation handled successfully. Order status updated to: ${newOrderStatus}`,
      action,
      escalationNotes
    });
  } catch (error) {
    console.error("Error handling escalation:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
